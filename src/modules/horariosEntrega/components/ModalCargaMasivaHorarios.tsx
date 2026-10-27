import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import * as horariosEntregaApi from '../api/horariosEntregaApi';
import type { FilaCargaHorario, IdentificadorCarga, ReporteCargaHorarios } from '../api/horariosEntregaApi';
import {
  descargarPlantillaHorarios,
  descargarReporteHorarios,
  ErrorLecturaExcelHorarios,
  leerExcelCargaHorarios,
} from '../utils/excelCargaHorarios';

type Paso = 'seleccion' | 'revisando' | 'revision' | 'aplicando' | 'listo';

const ETIQUETA_CLASIFICACION: Record<string, string> = {
  Perecibles: 'Perecibles',
  No_Perecibles: 'No Perecibles',
  Fruver: 'Fruver',
};

function Metrica({ valor, etiqueta, tono }: { valor: number; etiqueta: string; tono: 'ok' | 'info' | 'aviso' | 'error' }) {
  const clases = {
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
    aviso: 'border-amber-200 bg-amber-50 text-amber-800',
    error: 'border-brand-wine/20 bg-brand-wine/5 text-brand-wine',
  }[tono];

  return (
    <div className={`rounded-lg border px-3 py-2 ${clases}`}>
      <p className="font-display text-lg font-bold leading-none">{valor}</p>
      <p className="mt-1 text-[12px] opacity-75">{etiqueta}</p>
    </div>
  );
}

function mensajeError(e: unknown, porDefecto: string): string {
  if (e instanceof ErrorLecturaExcelHorarios) return e.message;
  if (axios.isAxiosError(e)) {
    const datos = e.response?.data as { errors?: Record<string, string[]>; message?: string } | undefined;
    return Object.values(datos?.errors ?? {})[0]?.[0] ?? datos?.message ?? porDefecto;
  }
  return porDefecto;
}

/**
 * Carga masiva del calendario desde Excel. Sistemas y Admin (21-oct-2026; Admin desde el 27-oct-2026).
 *
 * Tres pasos a propósito, igual que la carga de cuentas: elegir el archivo,
 * REVISAR y recién ahí aplicar. La revisión no la calcula esta pantalla: es
 * una vista previa del backend (confirmar = false), que es quien sabe qué
 * horarios existen. Importa porque el archivo REEMPLAZA el calendario de las
 * clasificaciones que trae, y lo que se da de baja tiene que verse ANTES.
 */
export default function ModalCargaMasivaHorarios({ onClose, onCargado }: { onClose: () => void; onCargado: () => void }) {
  const [paso, setPaso] = useState<Paso>('seleccion');
  const [error, setError] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [lectura, setLectura] = useState<{ identificador: IdentificadorCarga; filas: FilaCargaHorario[] } | null>(null);
  const [reporte, setReporte] = useState<ReporteCargaHorarios | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: proveedores } = useQuery({
    queryKey: ['horarios-entrega-proveedores'],
    queryFn: horariosEntregaApi.listarProveedores,
  });

  async function elegirArchivo(archivo: File | undefined) {
    if (!archivo) return;

    setError(null);
    setNombreArchivo(archivo.name);
    setPaso('revisando');

    try {
      const leido = await leerExcelCargaHorarios(archivo);
      setLectura(leido);
      setReporte(await horariosEntregaApi.cargaMasiva(leido.identificador, leido.filas, false));
      setPaso('revision');
    } catch (e) {
      setError(mensajeError(e, 'No se pudo revisar el archivo. Intenta de nuevo.'));
      setPaso('seleccion');
    }
  }

  async function aplicar() {
    if (!lectura) return;

    setError(null);
    setPaso('aplicando');

    try {
      setReporte(await horariosEntregaApi.cargaMasiva(lectura.identificador, lectura.filas, true));
      setPaso('listo');
      onCargado();
    } catch (e) {
      setError(mensajeError(e, 'No se pudo aplicar la carga. No se cambió nada; intenta de nuevo.'));
      setPaso('revision');
    }
  }

  function volverAEmpezar() {
    setLectura(null);
    setReporte(null);
    setError(null);
    setPaso('seleccion');
    if (inputRef.current) inputRef.current.value = '';
  }

  const errores = reporte?.filas.filter((f) => f.estado === 'error') ?? [];
  const cargables = (reporte?.resumen.crear ?? 0) + (reporte?.resumen.actualizar ?? 0);

  return (
    <Modal onClose={onClose} title="Carga masiva de horarios" maxWidth="max-w-3xl" expandible>
      <div className="space-y-4">
        {paso === 'seleccion' && (
          <>
            <p className="text-sm text-brand-900/70">
              Sube un Excel con una fila por horario. El proveedor va por <strong>código BC</strong> o por{' '}
              <strong>RUC</strong>, el mismo para todo el archivo. Descarga la plantilla que prefieras: trae las
              instrucciones y la lista de proveedores con su código y su RUC.
            </p>

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" className="text-xs px-3 py-1.5" onClick={() => descargarPlantillaHorarios('codigo_bc', proveedores ?? [])}>
                Plantilla con código BC
              </Button>
              <Button variant="secondary" className="text-xs px-3 py-1.5" onClick={() => descargarPlantillaHorarios('ruc', proveedores ?? [])}>
                Plantilla con RUC
              </Button>
            </div>

            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
              El archivo <strong>reemplaza</strong> el calendario de las clasificaciones que trae: los horarios de esas
              clasificaciones que no vengan en el archivo se dan de baja. Antes de aplicar vas a ver exactamente qué cambia.
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-brand-900/20 px-4 py-8 text-center hover:border-brand-700/40 hover:bg-brand-200/10">
              <span className="text-sm font-medium text-brand-900">Elegir archivo Excel</span>
              <span className="text-xs text-brand-900/50">.xlsx, hasta 1000 horarios</span>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => elegirArchivo(e.target.files?.[0])}
              />
            </label>
          </>
        )}

        {(paso === 'revisando' || paso === 'aplicando') && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Spinner className="h-6 w-6" />
            <p className="text-sm text-brand-900/60">{paso === 'revisando' ? `Revisando ${nombreArchivo}...` : 'Aplicando la carga...'}</p>
          </div>
        )}

        {(paso === 'revision' || paso === 'listo') && reporte && (
          <>
            <div>
              <p className="text-sm font-medium text-brand-900">
                {paso === 'listo' ? 'Carga aplicada' : 'Revisa antes de aplicar'} · {nombreArchivo}
              </p>
              <p className="text-xs text-brand-900/55">
                Proveedores por {reporte.identificador === 'ruc' ? 'RUC' : 'código BC'} · se reemplaza:{' '}
                {reporte.clasificaciones.map((c) => ETIQUETA_CLASIFICACION[c] ?? c).join(', ') || '—'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Metrica valor={reporte.resumen.crear} etiqueta={paso === 'listo' ? 'Creados' : 'Se crean'} tono="ok" />
              <Metrica valor={reporte.resumen.actualizar} etiqueta={paso === 'listo' ? 'Actualizados' : 'Se actualizan'} tono="info" />
              <Metrica valor={reporte.resumen.dar_de_baja} etiqueta={paso === 'listo' ? 'Dados de baja' : 'Se dan de baja'} tono="aviso" />
              <Metrica valor={reporte.resumen.errores} etiqueta="Filas con error" tono="error" />
            </div>

            {errores.length > 0 && (
              <section className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wide text-brand-wine">
                  Filas con error ({errores.length}) · no se cargan
                </h3>
                <div className="max-h-48 overflow-y-auto rounded-md border border-brand-wine/15">
                  <table className="w-full text-[13px]">
                    <tbody className="divide-y divide-brand-900/6">
                      {errores.map((f) => (
                        <tr key={f.numero_fila}>
                          <td className="w-16 px-3 py-1.5 text-brand-900/50">Fila {f.numero_fila}</td>
                          <td className="px-3 py-1.5 text-brand-900">{f.mensaje}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {reporte.bajas.length > 0 && (
              <section className="space-y-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wide text-amber-800">
                  {paso === 'listo' ? 'Dados de baja' : 'Se dan de baja'} ({reporte.bajas.length}) · no vienen en el archivo
                </h3>
                <div className="max-h-48 overflow-y-auto rounded-md border border-amber-200">
                  <table className="w-full text-[13px]">
                    <tbody className="divide-y divide-brand-900/6">
                      {reporte.bajas.map((b, i) => (
                        <tr key={i}>
                          <td className="px-3 py-1.5 text-brand-900">{b.nombre_proveedor ?? '—'}</td>
                          <td className="px-3 py-1.5 text-brand-900/60">{ETIQUETA_CLASIFICACION[b.clasificacion] ?? b.clasificacion}</td>
                          <td className="px-3 py-1.5 text-brand-900/60">{b.dia_entrega}</td>
                          <td className="px-3 py-1.5 text-right text-brand-900/60">{b.hora_llegada}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {paso === 'revision' && errores.length > 0 && (
              <p className="text-xs text-brand-900/60">
                Si una fila con error era de un proveedor que ya tenía horario ese día, ese horario también aparece en
                "Se dan de baja". Corrige el archivo y vuelve a subirlo si no es lo que quieres.
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <Button variant="ghost" className="text-xs px-3 py-1.5" onClick={() => descargarReporteHorarios(reporte.filas)}>
                Descargar reporte
              </Button>
              {paso === 'revision' ? (
                <>
                  <Button variant="secondary" className="text-xs px-3 py-1.5" onClick={volverAEmpezar}>
                    Elegir otro archivo
                  </Button>
                  <Button className="text-xs px-3 py-1.5" onClick={aplicar} disabled={cargables === 0 && reporte.resumen.dar_de_baja === 0}>
                    Aplicar carga ({cargables} horario{cargables === 1 ? '' : 's'})
                  </Button>
                </>
              ) : (
                <Button className="text-xs px-3 py-1.5" onClick={onClose}>
                  Cerrar
                </Button>
              )}
            </div>
          </>
        )}

        {error && <p className="text-sm text-brand-wine">{error}</p>}
      </div>
    </Modal>
  );
}
