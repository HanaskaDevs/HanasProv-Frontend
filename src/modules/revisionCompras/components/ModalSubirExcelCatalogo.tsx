// src/modules/revisionCompras/components/ModalSubirExcelCatalogo.tsx
import { useRef, useState } from 'react';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import * as productosApi from '../../fichaProductos/api/productosApi';
import axios from 'axios';
import { ErrorLecturaExcelRevision, leerExcelRevision } from '../utils/excelRevisionCatalogo';
import type { FilaImportacionRevision, ReporteImportacionRevision } from '../types';

/**
 * Lo que dijo el backend, sea un 422 (archivo demasiado grande, columna ID
 * faltante) o un 403 (el rol no usa este Excel). Mismo orden que en
 * RevisionComprasPage: primero los errores de validación, después el mensaje.
 */
function mensajeDeError(e: unknown, porDefecto: string): string {
  const respuesta = axios.isAxiosError(e) ? e.response?.data : null;
  const deValidacion = respuesta?.errors ? (Object.values(respuesta.errors).flat() as string[])[0] : null;

  return deValidacion ?? respuesta?.message ?? porDefecto;
}

type Paso = 'seleccion' | 'leyendo' | 'revision' | 'guardando' | 'listo';

interface Props {
  onClose: () => void;
  /** Se dispara al guardar bien, para que la bandeja se refresque. */
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

/**
 * Sube el Excel de los productos que esperan a Catálogo (18-nov-2026).
 *
 * Dos pasos, igual que la carga de códigos BC del Catálogo de productos
 * (ModalImportarCodigosBc): primero el backend dice QUÉ va a cambiar sin
 * guardar nada, y recién con eso a la vista el usuario confirma. Acá el
 * reporte muestra el antes y el después de cada dato, porque el archivo
 * puede tocar quince campos de cientos de productos y nadie debería guardar
 * eso a ciegas.
 *
 * Solo actualiza datos: los productos siguen esperando a Catálogo.
 */
export default function ModalSubirExcelCatalogo({ onClose, onImportado }: Props) {
  const inputArchivo = useRef<HTMLInputElement>(null);

  const [paso, setPaso] = useState<Paso>('seleccion');
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [filas, setFilas] = useState<FilaImportacionRevision[]>([]);
  const [reporte, setReporte] = useState<ReporteImportacionRevision | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function alSeleccionarArchivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;

    setError(null);
    setNombreArchivo(archivo.name);
    setPaso('leyendo');

    try {
      // 1. El navegador convierte el .xlsx a filas de texto.
      const filasLeidas = await leerExcelRevision(archivo);
      setFilas(filasLeidas);

      // 2. El backend interpreta cada celda y devuelve el reporte SIN
      //    guardar nada.
      setReporte(await productosApi.validarExcelCatalogo(filasLeidas));
      setPaso('revision');
    } catch (e) {
      setError(
        e instanceof ErrorLecturaExcelRevision
          ? e.message
          : mensajeDeError(e, 'No se pudo procesar el archivo. Intenta de nuevo.')
      );
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
      setReporte(await productosApi.importarExcelCatalogo(filas));
      setPaso('listo');
      onImportado();
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudieron guardar los cambios.'));
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
    <Modal onClose={onClose} title="Subir Excel de productos por revisar" maxWidth="max-w-3xl" expandible>
      <div className="space-y-4">
        {/* ---------------- Selección de archivo ---------------- */}
        {(paso === 'seleccion' || paso === 'leyendo') && (
          <>
            <div className="rounded-lg bg-brand-200/25 px-4 py-3 text-xs text-brand-900/75 leading-relaxed">
              Sube el mismo archivo que descargaste con <strong className="font-semibold">Descargar Excel</strong>, ya
              corregido. Se actualizan los datos del producto (nombre, código de barras, categoría, unidad, precio,
              peso, medidas y grupos); <strong className="font-semibold">ID, PROVEEDOR, RUC y CODIGO BC</strong> son de
              referencia y no se tocan.
              <br />
              Los productos siguen esperando a Catálogo: después los apruebas, devuelves o retiras desde la lista. Antes
              de guardar vas a ver qué cambia en cada uno.
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
                  disabled={ocupado}
                  className="text-xs text-brand-700 hover:text-brand-900 underline underline-offset-2 shrink-0 disabled:opacity-40"
                >
                  Cambiar archivo
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Metrica
                valor={reporte.actualizados}
                etiqueta={paso === 'listo' ? 'Productos actualizados' : 'Productos a actualizar'}
                tono="ok"
              />
              <Metrica valor={reporte.sin_cambio} etiqueta="Sin cambios" tono="neutro" />
              <Metrica valor={reporte.con_error} etiqueta="Con error" tono="error" />
            </div>

            {reporte.cambios.length > 0 && (
              <div className="rounded-lg border border-emerald-200 overflow-hidden">
                <p className="bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                  {paso === 'listo' ? 'Esto se actualizó:' : 'Esto es lo que va a cambiar:'}
                </p>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-brand-900/[0.03] text-left text-brand-900/60 sticky top-0">
                      <tr>
                        <th className="px-3 py-1.5 font-medium w-12">Fila</th>
                        <th className="px-3 py-1.5 font-medium">Producto</th>
                        <th className="px-3 py-1.5 font-medium">Cambios</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-900/8">
                      {reporte.cambios.map((c) => (
                        <tr key={`${c.fila}-${c.id_producto}`} className="align-top">
                          <td className="px-3 py-1.5 text-brand-900/60">{c.fila}</td>
                          <td className="px-3 py-1.5">
                            <p className="text-brand-900 font-medium">{c.producto}</p>
                            <p className="text-brand-900/50">{c.proveedor}</p>
                          </td>
                          <td className="px-3 py-1.5">
                            <ul className="space-y-0.5">
                              {c.cambios.map((cambio) => (
                                <li key={cambio.campo} className="text-brand-900/80">
                                  <span className="text-brand-900/50">{cambio.campo}:</span>{' '}
                                  <span className="line-through text-brand-900/40">{cambio.antes || 'vacío'}</span>
                                  {' → '}
                                  <span className="font-medium text-brand-900">{cambio.despues || 'vacío'}</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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
                        <th className="px-3 py-1.5 font-medium w-12">Fila</th>
                        <th className="px-3 py-1.5 font-medium">Producto</th>
                        <th className="px-3 py-1.5 font-medium">Motivo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-900/8">
                      {reporte.errores.map((e) => (
                        <tr key={`${e.fila}-${e.id_producto}`} className="align-top">
                          <td className="px-3 py-1.5 text-brand-900/60">{e.fila}</td>
                          <td className="px-3 py-1.5 text-brand-900">{e.producto || `ID ${e.id_producto}`}</td>
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
                Cambios guardados. Los productos siguen esperando a Catálogo en la lista.
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
                      : `Actualizar ${reporte.actualizados} producto${reporte.actualizados === 1 ? '' : 's'}`}
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
