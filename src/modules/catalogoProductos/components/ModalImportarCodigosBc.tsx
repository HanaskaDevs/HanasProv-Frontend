// src/modules/catalogoProductos/components/ModalImportarCodigosBc.tsx
import { useRef, useState } from 'react';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import * as catalogoApi from '../api/catalogoProductosApi';
import { ErrorLecturaExcel, leerExcelCodigosBc } from '../utils/excelCodigosBc';
import type { FilaImportacion, ReporteImportacion } from '../types';

type Paso = 'seleccion' | 'leyendo' | 'revision' | 'guardando' | 'listo';

interface Props {
  onClose: () => void;
  /** Se dispara al terminar bien, para que la tabla se refresque. */
  onImportado: () => void;
}

function Metrica({ valor, etiqueta, tono }: { valor: number; etiqueta: string; tono: 'ok' | 'neutro' | 'error' }) {
  const clases = {
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-800',
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

export default function ModalImportarCodigosBc({ onClose, onImportado }: Props) {
  const inputArchivo = useRef<HTMLInputElement>(null);

  const [paso, setPaso] = useState<Paso>('seleccion');
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [filas, setFilas] = useState<FilaImportacion[]>([]);
  const [reporte, setReporte] = useState<ReporteImportacion | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function alSeleccionarArchivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;

    setError(null);
    setNombreArchivo(archivo.name);
    setPaso('leyendo');

    try {
      // 1. El navegador convierte el .xlsx a JSON.
      const filasLeidas = await leerExcelCodigosBc(archivo);
      setFilas(filasLeidas);

      // 2. El backend valida contra la base y devuelve el reporte SIN
      //    guardar nada -> el usuario ve qué va a pasar antes de decidir.
      const previo = await catalogoApi.validarImportacion(filasLeidas);
      setReporte(previo);
      setPaso('revision');
    } catch (e) {
      if (e instanceof ErrorLecturaExcel) {
        setError(e.message);
      } else {
        const mensaje = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(mensaje ?? 'No se pudo procesar el archivo. Intenta de nuevo.');
      }
      setPaso('seleccion');
    } finally {
      // Permite volver a elegir el MISMO archivo después de corregirlo.
      if (inputArchivo.current) inputArchivo.current.value = '';
    }
  }

  async function confirmar() {
    setPaso('guardando');
    setError(null);

    try {
      const final = await catalogoApi.importarCodigosBc(filas);
      setReporte(final);
      setPaso('listo');
      onImportado();
    } catch (e) {
      const mensaje = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(mensaje ?? 'No se pudieron guardar los cambios.');
      setPaso('revision');
    }
  }

  function reiniciar() {
    setPaso('seleccion');
    setFilas([]);
    setReporte(null);
    setNombreArchivo('');
    setError(null);
  }

  const ocupado = paso === 'leyendo' || paso === 'guardando';

  return (
    <Modal onClose={onClose} title="Cargar códigos BC desde Excel" maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* ---------------- Selección de archivo ---------------- */}
        {(paso === 'seleccion' || paso === 'leyendo') && (
          <>
            <div className="rounded-lg bg-brand-200/25 px-4 py-3 text-xs text-brand-900/75 leading-relaxed">
              Sube el mismo archivo que descargaste desde esta pantalla, con la columna{' '}
              <strong className="font-semibold">CODIGO BC</strong> completada. Solo se lee esa columna y el{' '}
              <strong className="font-semibold">ID</strong>; el resto es de referencia y no se toca.
              <br />
              Las celdas que dejes vacías se ignoran, no borran el código que ya tenía el producto.
            </div>

            {error && (
              <div className="rounded-lg border border-brand-wine/25 bg-brand-wine/5 px-4 py-3 text-xs text-brand-wine">
                {error}
              </div>
            )}

            <input
              ref={inputArchivo}
              type="file"
              accept=".xlsx,.xls"
              onChange={alSeleccionarArchivo}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-brand-900/20 py-10">
              {paso === 'leyendo' ? (
                <>
                  <Spinner />
                  <p className="text-xs text-brand-900/55">Leyendo y validando {nombreArchivo}...</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-brand-900/50">Formatos aceptados: .xlsx, .xls</p>
                  <Button onClick={() => inputArchivo.current?.click()}>Seleccionar archivo</Button>
                </>
              )}
            </div>
          </>
        )}

        {/* ---------------- Revisión / resultado ---------------- */}
        {(paso === 'revision' || paso === 'guardando' || paso === 'listo') && reporte && (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-brand-900/55 truncate">
                {nombreArchivo} · {reporte.total_filas} filas leídas
              </p>
              {paso !== 'listo' && (
                <button
                  onClick={reiniciar}
                  className="text-xs text-brand-700 hover:text-brand-900 underline underline-offset-2 shrink-0"
                >
                  Cambiar archivo
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Metrica
                valor={reporte.actualizados}
                etiqueta={paso === 'listo' ? 'Actualizados' : 'Se van a actualizar'}
                tono="ok"
              />
              <Metrica valor={reporte.sin_cambio} etiqueta="Sin cambios" tono="neutro" />
              <Metrica valor={reporte.con_error} etiqueta="Con error" tono="error" />
            </div>

            {reporte.con_error > 0 && (
              <div className="rounded-lg border border-brand-wine/20 overflow-hidden">
                <p className="bg-brand-wine/5 px-3 py-2 text-xs font-medium text-brand-wine">
                  {paso === 'listo'
                    ? 'Estas filas se descartaron:'
                    : 'Estas filas se van a descartar (el resto sí se guarda):'}
                </p>
                <div className="max-h-52 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-brand-900/[0.03] text-left text-brand-900/60 sticky top-0">
                      <tr>
                        <th className="px-3 py-1.5 font-medium">Fila</th>
                        <th className="px-3 py-1.5 font-medium">ID</th>
                        <th className="px-3 py-1.5 font-medium">Código BC</th>
                        <th className="px-3 py-1.5 font-medium">Motivo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-900/8">
                      {reporte.errores.map((e) => (
                        <tr key={`${e.fila}-${e.id_producto}`}>
                          <td className="px-3 py-1.5 text-brand-900/60">{e.fila}</td>
                          <td className="px-3 py-1.5 text-brand-900/60">{e.id_producto}</td>
                          <td className="px-3 py-1.5 font-mono text-brand-900">{e.bc_nro_producto || '—'}</td>
                          <td className="px-3 py-1.5 text-brand-wine">{e.motivo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-brand-wine/25 bg-brand-wine/5 px-4 py-3 text-xs text-brand-wine">
                {error}
              </div>
            )}

            {paso === 'listo' && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
                Cambios guardados. Ya se reflejan en el catálogo.
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              {paso === 'listo' ? (
                <Button onClick={onClose}>Cerrar</Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={onClose} disabled={ocupado}>
                    Cancelar
                  </Button>
                  <Button onClick={confirmar} isLoading={paso === 'guardando'} disabled={reporte.actualizados === 0}>
                    {reporte.actualizados === 0
                      ? 'No hay nada que guardar'
                      : `Guardar ${reporte.actualizados} cambio${reporte.actualizados === 1 ? '' : 's'}`}
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}