import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as responsablesApi from '../api/responsablesApi';
import {
  ErrorLecturaExcel,
  leerArchivoAsignaciones,
  type LecturaAsignaciones,
} from '../utils/leerArchivoAsignaciones';
import type { ReporteImportacion } from '../types';
import Button from '../../../shared/components/Button';

/**
 * Importación del archivo de asignaciones, en dos pasos: primero se
 * muestra el reporte (qué entra, qué cambia, qué está mal) y recién si el
 * usuario acepta se aplica.
 *
 * SE VALIDA ANTES DE GUARDAR porque el archivo real son cientos de filas:
 * si entra con la mitad mal, deshacerlo a mano no es viable. El paso de
 * validación no escribe nada en la base.
 */
export default function ModalImportarAsignaciones({
  correosConocidos,
  onCerrar,
}: {
  /** Correos ya cargados como responsables, para avisar de los que faltan. */
  correosConocidos: string[];
  onCerrar: () => void;
}) {
  const queryClient = useQueryClient();
  const [lectura, setLectura] = useState<LecturaAsignaciones | null>(null);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [reporte, setReporte] = useState<ReporteImportacion | null>(null);
  const [leyendo, setLeyendo] = useState(false);

  const conocidos = new Set(correosConocidos.map((c) => c.toLowerCase()));
  const correosFaltantes = (lectura?.correosUsados ?? []).filter((c) => !conocidos.has(c));

  const validar = useMutation({
    mutationFn: () => responsablesApi.validarImportacion(lectura!.filas),
    onSuccess: setReporte,
  });

  const aplicar = useMutation({
    mutationFn: () => responsablesApi.importarAsignaciones(lectura!.filas),
    onSuccess: (resultado) => {
      setReporte(resultado);
      queryClient.invalidateQueries({ queryKey: ['responsables'] });
      queryClient.invalidateQueries({ queryKey: ['responsables-asignaciones'] });
    },
  });

  async function elegirArchivo(archivo: File | null) {
    setLectura(null);
    setReporte(null);
    setErrorArchivo(null);

    if (!archivo) return;

    setLeyendo(true);
    try {
      setLectura(await leerArchivoAsignaciones(archivo));
    } catch (error) {
      setErrorArchivo(
        error instanceof ErrorLecturaExcel ? error.message : 'No se pudo leer el archivo.'
      );
    } finally {
      setLeyendo(false);
    }
  }

  const yaSeAplico = reporte?.aplicado === true;

  return (
    <div className="fixed inset-0 bg-brand-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-brand-900/8">
          <h2 className="font-display text-base font-semibold text-brand-900">
            Importar asignaciones
          </h2>
          <button
            onClick={onCerrar}
            className="text-brand-900/40 hover:text-brand-900 text-xl leading-none px-2"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
          <div>
            <p className="text-sm text-brand-900/60 mb-3">
              Subí tu archivo tal como lo tenés. Las columnas se detectan solas: se busca la del
              código de proveedor de BC (PROV-0000056) y la del correo del responsable que esté a
              su lado. No hace falta reordenar ni renombrar nada.
            </p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => elegirArchivo(e.target.files?.[0] ?? null)}
              className="text-sm"
              disabled={leyendo || aplicar.isPending}
            />
          </div>

          {leyendo && <p className="text-sm text-brand-900/50">Leyendo el archivo...</p>}

          {errorArchivo && (
            <div className="rounded-md bg-brand-wine/10 border border-brand-wine/20 px-3 py-2">
              <p className="text-sm text-brand-wine">{errorArchivo}</p>
            </div>
          )}

          {lectura && (
            <div className="rounded-md bg-brand-200/40 px-3 py-2.5 text-sm text-brand-900/80 space-y-1">
              <p>
                <strong>{lectura.filas.length}</strong> proveedores leídos. Código en la columna{' '}
                <strong>{lectura.columnaCodigo}</strong>, correo en la{' '}
                <strong>{lectura.columnaCorreo}</strong>.
              </p>
              {lectura.personas.length > 0 && (
                <p className="text-brand-900/55 text-xs">
                  También se encontró la tabla de responsables al costado:{' '}
                  {lectura.personas.map((p) => p.nombre).join(', ')}.
                </p>
              )}
            </div>
          )}

          {/* Los correos que el archivo usa pero que todavía no están
              cargados como responsables. El backend los rechazaría fila
              por fila; avisarlo acá evita un reporte lleno del mismo
              error repetido cientos de veces. */}
          {correosFaltantes.length > 0 && (
            <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2.5">
              <p className="text-sm font-medium text-amber-900 mb-1">
                Faltan cargar estos responsables
              </p>
              <p className="text-xs text-amber-900/80 mb-1.5">
                El archivo los menciona, pero todavía no están en la lista. Agregalos primero —con
                su nombre y teléfono— y volvé a importar; si no, esas filas van a dar error.
              </p>
              <ul className="text-xs text-amber-900/90 space-y-0.5">
                {correosFaltantes.map((correo) => (
                  <li key={correo}>
                    · {correo}
                    {lectura?.personas.find((p) => p.correo === correo) &&
                      ` — en el archivo figura como ${
                        lectura.personas.find((p) => p.correo === correo)?.nombre
                      }`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reporte && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  ['Nuevas', reporte.nuevas],
                  ['Cambian', reporte.cambios],
                  ['Sin cambio', reporte.sin_cambio],
                ].map(([etiqueta, valor]) => (
                  <div key={etiqueta} className="rounded-md border border-brand-900/10 py-2">
                    <p className="font-display text-lg font-semibold text-brand-900">{valor}</p>
                    <p className="text-xs text-brand-900/50">{etiqueta}</p>
                  </div>
                ))}
              </div>

              {reporte.errores.length > 0 && (
                <div className="rounded-md border border-brand-wine/20 bg-brand-wine/5">
                  <p className="text-sm font-medium text-brand-wine px-3 py-2 border-b border-brand-wine/15">
                    {reporte.errores.length} fila(s) con problemas — el resto se importa igual
                  </p>
                  <ul className="max-h-48 overflow-y-auto text-xs divide-y divide-brand-wine/10">
                    {reporte.errores.map((error, indice) => (
                      <li key={`${error.fila}-${indice}`} className="px-3 py-1.5">
                        <span className="text-brand-900/50">Fila {error.fila}</span>{' '}
                        <span className="font-medium text-brand-900">{error.codigo_bc || '—'}</span>
                        <span className="text-brand-900/70"> · {error.motivo}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {yaSeAplico && (
                <p className="text-sm text-brand-900/70">
                  Listo. Se guardaron {reporte.nuevas + reporte.cambios} asignación(es).
                </p>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 flex items-center justify-end gap-2 px-6 py-3 border-t border-brand-900/8">
          <Button variant="ghost" onClick={onCerrar}>
            {yaSeAplico ? 'Cerrar' : 'Cancelar'}
          </Button>

          {!yaSeAplico && lectura && !reporte && (
            <Button onClick={() => validar.mutate()} isLoading={validar.isPending}>
              Revisar antes de guardar
            </Button>
          )}

          {!yaSeAplico && reporte && (
            <Button
              onClick={() => aplicar.mutate()}
              isLoading={aplicar.isPending}
              disabled={reporte.nuevas + reporte.cambios === 0}
            >
              Guardar {reporte.nuevas + reporte.cambios} asignación(es)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
