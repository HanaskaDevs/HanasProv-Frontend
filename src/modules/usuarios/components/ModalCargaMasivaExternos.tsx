// src/modules/usuarios/components/ModalCargaMasivaExternos.tsx
import { useMemo, useRef, useState } from 'react';
import axios from 'axios';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import { useAuth } from '../../auth/hooks/useAuth';
import { ROLES } from '../../auth/types';
import {
  crearExternosLote,
  MAX_FILAS_CARGA_MASIVA,
  type FilaCargaMasiva,
  type ReporteCargaMasiva,
  type ResultadoFilaCarga,
} from '../api/usuariosApi';
import {
  claveNombreEmpresa,
  descargarPlantillaCargaProveedores,
  descargarReporteCargaProveedores,
  ErrorLecturaExcel,
  leerExcelCargaProveedores,
  SEPARADOR_EMPRESAS,
} from '../utils/excelCargaProveedores';

/**
 * Carga masiva de proveedores desde Excel. Solo rol Sistemas.
 *
 * Por qué existe: dar de alta proveedores de a uno en "Nuevo usuario" no
 * escala. Compras trae listas de decenas de correos y el formulario
 * individual obliga a repetir correo + empresas una por una.
 *
 * El flujo es de tres pasos a propósito (elegir -> revisar -> procesar).
 * El paso de revisión NO es decorativo: muestra lo que se leyó del archivo
 * y los problemas detectables acá (correo inválido, empresa que el portal
 * no reconoce, correo repetido) ANTES de crear nada. Sin ese paso, un
 * archivo con la columna de empresas mal escrita se descubre recién después
 * de haber mandado decenas de correos de activación, y un correo de
 * activación no se puede "desenviar".
 *
 * Ojo con qué valida quién: los avisos de este modal son comodidad. La
 * validación que protege es la del backend, que revisa cada fila de nuevo
 * (la API es pública). Por eso el resultado final se lee SIEMPRE del
 * reporte que responde el servidor y no de lo que calculó esta pantalla.
 */

type Paso = 'seleccion' | 'leyendo' | 'revision' | 'procesando' | 'listo';

interface Props {
  onClose: () => void;
  /** Se dispara al terminar, para que la tabla de usuarios se refresque. */
  onCargado: () => void;
}

interface AvisoLocal {
  numero_fila: number;
  email: string;
  motivo: string;
}

function Metrica({ valor, etiqueta, tono }: { valor: number; etiqueta: string; tono: 'ok' | 'info' | 'neutro' | 'error' }) {
  const clases = {
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
    neutro: 'border-brand-900/10 bg-white text-brand-900',
    error: 'border-brand-wine/20 bg-brand-wine/5 text-brand-wine',
  }[tono];

  return (
    <div className={`rounded-lg border px-3 py-2 ${clases}`}>
      <p className="text-lg font-display font-bold leading-none">{valor}</p>
      <p className="text-[12px] opacity-70 mt-1">{etiqueta}</p>
    </div>
  );
}

const CLASES_ESTADO: Record<ResultadoFilaCarga['estado'], string> = {
  creado: 'text-emerald-700',
  acceso_agregado: 'text-sky-700',
  omitido: 'text-brand-900/50',
  error: 'text-brand-wine',
};

const ETIQUETA_ESTADO: Record<ResultadoFilaCarga['estado'], string> = {
  creado: 'Creado',
  acceso_agregado: 'Acceso agregado',
  omitido: 'Sin cambios',
  error: 'Error',
};

export default function ModalCargaMasivaExternos({ onClose, onCargado }: Props) {
  const { usuario } = useAuth();
  const inputArchivo = useRef<HTMLInputElement>(null);

  const [paso, setPaso] = useState<Paso>('seleccion');
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [filas, setFilas] = useState<FilaCargaMasiva[]>([]);
  const [reporte, setReporte] = useState<ReporteCargaMasiva | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [descargando, setDescargando] = useState(false);

  /**
   * Empresas donde esta persona es Sistemas. Es la misma lista que arma el
   * backend en empresasDondeEsSistemas(): lo que no esté acá no se puede
   * cargar, así que el archivo no sirve para crear proveedores en empresas
   * ajenas.
   */
  const empresasPermitidas = useMemo(
    () => (usuario?.empresas ?? []).filter((e) => e.activo && e.nombre_rol === ROLES.SISTEMAS),
    [usuario]
  );

  const clavesPermitidas = useMemo(() => {
    const claves = new Set<string>();

    for (const e of empresasPermitidas) {
      claves.add(claveNombreEmpresa(e.razon_social));

      if (e.nombre_comercial) claves.add(claveNombreEmpresa(e.nombre_comercial));
    }

    return claves;
  }, [empresasPermitidas]);

  /**
   * Problemas que se pueden ver sin consultar al servidor. No incluye
   * "el correo ya existe en el portal": eso solo lo sabe el backend, y sale
   * en el reporte como "acceso agregado" o "sin cambios", que no son
   * errores.
   *
   * OJO: el código BC de la empresa también es un nombre válido para el
   * backend, pero acá no lo tenemos (la sesión no lo trae), así que una
   * fila escrita con el código BC aparece como aviso y de todas formas se
   * procesa bien. Por eso son avisos y no bloqueos.
   */
  const avisos = useMemo<AvisoLocal[]>(() => {
    const encontrados: AvisoLocal[] = [];
    const vistos = new Map<string, number>();

    for (const fila of filas) {
      const agregar = (motivo: string) =>
        encontrados.push({ numero_fila: fila.numero_fila, email: fila.email, motivo });

      // Mismo criterio que el backend: formato de correo y tope de 150.
      if (fila.email === '') {
        agregar('Sin correo.');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fila.email)) {
        agregar('El correo no tiene un formato válido.');
      } else if (fila.email.length > 150) {
        agregar('El correo pasa de 150 caracteres.');
      } else if (vistos.has(fila.email)) {
        agregar(`Correo repetido: ya venía en la fila ${vistos.get(fila.email)}.`);
      }

      if (fila.email !== '' && !vistos.has(fila.email)) vistos.set(fila.email, fila.numero_fila);

      if (fila.empresas.length === 0) {
        agregar('Sin empresas con acceso.');
      } else {
        for (const nombre of fila.empresas) {
          if (!clavesPermitidas.has(claveNombreEmpresa(nombre))) {
            agregar(`No se reconoce la empresa "${nombre}".`);
          }
        }
      }
    }

    return encontrados;
  }, [filas, clavesPermitidas]);

  const filasConAviso = useMemo(() => new Set(avisos.map((a) => a.numero_fila)), [avisos]);

  async function descargarPlantilla() {
    setDescargando(true);
    setError(null);

    try {
      await descargarPlantillaCargaProveedores(empresasPermitidas);
    } catch {
      setError('No se pudo generar la plantilla. Intenta de nuevo.');
    } finally {
      setDescargando(false);
    }
  }

  async function alSeleccionarArchivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;

    setError(null);
    setNombreArchivo(archivo.name);
    setPaso('leyendo');

    try {
      const leidas = await leerExcelCargaProveedores(archivo);

      if (leidas.length > MAX_FILAS_CARGA_MASIVA) {
        throw new ErrorLecturaExcel(
          `El archivo tiene ${leidas.length} filas y el máximo por carga es ${MAX_FILAS_CARGA_MASIVA}. Divídelo en dos archivos.`
        );
      }

      setFilas(leidas);
      setPaso('revision');
    } catch (e) {
      setError(
        e instanceof ErrorLecturaExcel ? e.message : 'No se pudo leer el archivo. Intenta de nuevo.'
      );
      setPaso('seleccion');
    } finally {
      // Permite volver a elegir el MISMO archivo después de corregirlo.
      if (inputArchivo.current) inputArchivo.current.value = '';
    }
  }

  async function procesar() {
    setPaso('procesando');
    setError(null);

    try {
      const resultado = await crearExternosLote(filas);
      setReporte(resultado);
      setPaso('listo');
      // Se refresca la tabla aunque haya filas con error: las que sí se
      // crearon ya existen y tienen que verse.
      onCargado();
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 403) {
        setError('No tienes rol Sistemas en esta empresa. La carga masiva es exclusiva de Sistemas.');
      } else if (axios.isAxiosError(e) && e.response?.status === 429) {
        setError('Se hicieron demasiadas cargas seguidas. Espera un minuto y vuelve a intentar.');
      } else if (axios.isAxiosError(e) && e.response?.status === 422) {
        const errores = e.response.data?.errors as Record<string, string[]> | undefined;
        const primero = errores ? Object.values(errores)[0]?.[0] : null;
        setError(primero ?? e.response.data?.message ?? 'El archivo no pasó la validación del servidor.');
      } else {
        setError('Ocurrió un error al procesar el archivo. Ninguna fila posterior al fallo se creó.');
      }
      setPaso('revision');
    }
  }

  async function descargarReporte() {
    if (!reporte) return;

    setDescargando(true);

    try {
      await descargarReporteCargaProveedores(reporte.filas);
    } catch {
      setError('No se pudo generar el reporte.');
    } finally {
      setDescargando(false);
    }
  }

  function reiniciar() {
    setPaso('seleccion');
    setFilas([]);
    setReporte(null);
    setNombreArchivo('');
    setError(null);
  }

  const ocupado = paso === 'leyendo' || paso === 'procesando';

  return (
    <Modal onClose={onClose} title="Carga masiva de proveedores" maxWidth="max-w-3xl" expandible>
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-brand-wine/25 bg-brand-wine/5 px-4 py-3 text-xs text-brand-wine">
            {error}
          </div>
        )}

        {/* ---------------- 1. Elegir archivo ---------------- */}
        {(paso === 'seleccion' || paso === 'leyendo') && (
          <>
            <div className="rounded-lg bg-brand-200/25 px-4 py-3 text-xs text-brand-900/75 leading-relaxed space-y-1.5">
              <p>
                El Excel lleva tres columnas: <strong className="font-semibold">CODIGO PROVEEDOR</strong>,{' '}
                <strong className="font-semibold">CORREO</strong> y{' '}
                <strong className="font-semibold">EMPRESAS CON ACCESO</strong>. Una fila por proveedor,
                hasta {MAX_FILAS_CARGA_MASIVA} por archivo.
              </p>
              <p>
                Para dar acceso a varias empresas en la misma fila, sepáralas con{' '}
                <strong className="font-semibold">punto y coma</strong> (
                <code className="font-mono">HANASKA{SEPARADOR_EMPRESAS} COMERCIAL X</code>). No uses coma:
                las razones sociales la llevan y cortaría el nombre en dos.
              </p>
              <p>
                El código de proveedor es solo referencia para cuadrar tu archivo: sale en el reporte pero
                no se guarda en el portal.
              </p>
              <p className="text-brand-900/60">
                A cada correo nuevo le llega el correo de activación automáticamente. Un correo que ya
                exista en el portal no recibe nada: solo se le agregan las empresas que le falten.
              </p>
            </div>

            {empresasPermitidas.length === 0 && (
              <div className="rounded-lg border border-brand-wine/25 bg-brand-wine/5 px-4 py-3 text-xs text-brand-wine">
                No tienes rol Sistemas en ninguna empresa, así que no hay dónde cargar proveedores.
              </div>
            )}

            <input
              ref={inputArchivo}
              type="file"
              accept=".xlsx,.xls"
              onChange={alSeleccionarArchivo}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-brand-900/20 py-9">
              {paso === 'leyendo' ? (
                <>
                  <Spinner />
                  <p className="text-xs text-brand-900/55">Leyendo {nombreArchivo}...</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-brand-900/50">Formatos aceptados: .xlsx, .xls</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      onClick={descargarPlantilla}
                      isLoading={descargando}
                      disabled={empresasPermitidas.length === 0}
                    >
                      Descargar plantilla
                    </Button>
                    <Button
                      onClick={() => inputArchivo.current?.click()}
                      disabled={empresasPermitidas.length === 0}
                    >
                      Seleccionar archivo
                    </Button>
                  </div>
                  <p className="text-[11px] text-brand-900/45 text-center max-w-sm">
                    La plantilla trae una hoja "Empresas" con los nombres exactos que puedes usar, y dos
                    filas de ejemplo que se ignoran si te olvidas de borrarlas.
                  </p>
                </>
              )}
            </div>
          </>
        )}

        {/* ---------------- 2. Revisar antes de crear ---------------- */}
        {(paso === 'revision' || paso === 'procesando') && (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-brand-900/55 truncate">
                {nombreArchivo} · {filas.length} fila{filas.length === 1 ? '' : 's'} leída
                {filas.length === 1 ? '' : 's'}
              </p>
              <button
                onClick={reiniciar}
                disabled={ocupado}
                className="text-xs text-brand-700 hover:text-brand-900 underline underline-offset-2 shrink-0 disabled:opacity-40"
              >
                Cambiar archivo
              </button>
            </div>

            {avisos.length > 0 && (
              <div className="rounded-lg border border-amber-200 overflow-hidden">
                <p className="bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  <strong className="font-semibold">
                    {filasConAviso.size} fila{filasConAviso.size === 1 ? '' : 's'} con problemas
                  </strong>
                  . Puedes continuar: esas filas van a salir como error en el reporte y el resto se crea
                  igual. Si prefieres corregir el archivo primero, usa "Cambiar archivo".
                </p>
                <div className="max-h-40 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-brand-900/[0.03] text-left text-brand-900/60 sticky top-0">
                      <tr>
                        <th className="px-3 py-1.5 font-medium">Fila</th>
                        <th className="px-3 py-1.5 font-medium">Correo</th>
                        <th className="px-3 py-1.5 font-medium">Problema</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-900/8">
                      {avisos.map((a, i) => (
                        <tr key={`${a.numero_fila}-${i}`}>
                          <td className="px-3 py-1.5 text-brand-900/60">{a.numero_fila}</td>
                          <td className="px-3 py-1.5 text-brand-900/70">{a.email || '—'}</td>
                          <td className="px-3 py-1.5 text-amber-800">{a.motivo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-brand-900/10 overflow-hidden">
              <p className="bg-brand-900/[0.03] px-3 py-2 text-xs font-medium text-brand-900/70">
                Esto es lo que se leyó del archivo:
              </p>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-white text-left text-brand-900/60 sticky top-0">
                    <tr>
                      <th className="px-3 py-1.5 font-medium">Fila</th>
                      <th className="px-3 py-1.5 font-medium">Código</th>
                      <th className="px-3 py-1.5 font-medium">Correo</th>
                      <th className="px-3 py-1.5 font-medium">Empresas con acceso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-900/8">
                    {filas.map((f) => (
                      <tr key={f.numero_fila} className={filasConAviso.has(f.numero_fila) ? 'bg-amber-50/60' : ''}>
                        <td className="px-3 py-1.5 text-brand-900/60">{f.numero_fila}</td>
                        <td className="px-3 py-1.5 font-mono text-brand-900/70">{f.codigo_proveedor ?? '—'}</td>
                        <td className="px-3 py-1.5 text-brand-900">{f.email || '—'}</td>
                        <td className="px-3 py-1.5 text-brand-900/70">{f.empresas.join(', ') || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={onClose} disabled={ocupado}>
                Cancelar
              </Button>
              <Button onClick={procesar} isLoading={paso === 'procesando'}>
                Crear {filas.length} proveedor{filas.length === 1 ? '' : 'es'} y enviar activación
              </Button>
            </div>
          </>
        )}

        {/* ---------------- 3. Resultado ---------------- */}
        {paso === 'listo' && reporte && (
          <>
            <div className="grid grid-cols-4 gap-2">
              <Metrica valor={reporte.resumen.creados} etiqueta="Creados" tono="ok" />
              <Metrica valor={reporte.resumen.acceso_agregado} etiqueta="Acceso agregado" tono="info" />
              <Metrica valor={reporte.resumen.omitidos} etiqueta="Sin cambios" tono="neutro" />
              <Metrica valor={reporte.resumen.con_error} etiqueta="Con error" tono="error" />
            </div>

            {reporte.resumen.creados > 0 && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
                Se enviaron {reporte.resumen.creados} correo
                {reporte.resumen.creados === 1 ? '' : 's'} de activación. Salen por la cola de correo, así
                que pueden tardar unos minutos en llegar.
              </div>
            )}

            <div className="rounded-lg border border-brand-900/10 overflow-hidden">
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-brand-900/[0.03] text-left text-brand-900/60 sticky top-0">
                    <tr>
                      <th className="px-3 py-1.5 font-medium">Fila</th>
                      <th className="px-3 py-1.5 font-medium">Código</th>
                      <th className="px-3 py-1.5 font-medium">Correo</th>
                      <th className="px-3 py-1.5 font-medium">Resultado</th>
                      <th className="px-3 py-1.5 font-medium">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-900/8">
                    {reporte.filas.map((f) => (
                      <tr key={`${f.numero_fila}-${f.email}`}>
                        <td className="px-3 py-1.5 text-brand-900/60">{f.numero_fila}</td>
                        <td className="px-3 py-1.5 font-mono text-brand-900/70">{f.codigo_proveedor ?? '—'}</td>
                        <td className="px-3 py-1.5 text-brand-900">{f.email || '—'}</td>
                        <td className={`px-3 py-1.5 font-medium whitespace-nowrap ${CLASES_ESTADO[f.estado]}`}>
                          {ETIQUETA_ESTADO[f.estado]}
                        </td>
                        <td className="px-3 py-1.5 text-brand-900/70">{f.mensaje}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-1">
              <Button variant="secondary" onClick={descargarReporte} isLoading={descargando}>
                Descargar reporte
              </Button>
              <div className="flex gap-2">
                {reporte.resumen.con_error > 0 && (
                  <Button variant="ghost" onClick={reiniciar}>
                    Cargar otro archivo
                  </Button>
                )}
                <Button onClick={onClose}>Cerrar</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
