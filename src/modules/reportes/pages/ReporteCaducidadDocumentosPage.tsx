import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import RoleRoute from '../../../routes/RoleRoute';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import Input from '../../../shared/components/Input';
import * as reportesApi from '../api/reportesApi';
import type { DocumentoPorCaducar } from '../api/reportesApi';

/**
 * Reporte de Caducidad de Documentos.
 *
 * El objetivo es responder de un vistazo "¿a quién tengo que perseguir hoy?",
 * así que la pantalla está ordenada por URGENCIA y no por proveedor ni por
 * fecha: primero lo vencido, después lo que vence esta semana, y así.
 *
 * EL COLOR NO ES EL ÚNICO AVISO. Cada tramo lleva además su título, la
 * cantidad de documentos y los días que faltan escritos en cada fila: quien
 * no distinga rojo de ámbar (una de cada doce personas tiene alguna
 * dificultad con eso) recibe la misma información igual.
 */

/** Paleta por tramo. Las claves las define el backend (ReporteCaducidadService). */
const ESTILO_TRAMO: Record<string, { barra: string; chip: string; borde: string; punto: string }> = {
  vencido: {
    barra: 'bg-red-600',
    chip: 'bg-red-50 text-red-800 border-red-200',
    borde: 'border-l-red-600',
    punto: 'bg-red-600',
  },
  critico: {
    barra: 'bg-orange-500',
    chip: 'bg-orange-50 text-orange-800 border-orange-200',
    borde: 'border-l-orange-500',
    punto: 'bg-orange-500',
  },
  urgente: {
    barra: 'bg-amber-400',
    chip: 'bg-amber-50 text-amber-900 border-amber-200',
    borde: 'border-l-amber-400',
    punto: 'bg-amber-400',
  },
  proximo: {
    barra: 'bg-sky-500',
    chip: 'bg-sky-50 text-sky-800 border-sky-200',
    borde: 'border-l-sky-500',
    punto: 'bg-sky-500',
  },
  holgado: {
    barra: 'bg-emerald-500',
    chip: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    borde: 'border-l-emerald-500',
    punto: 'bg-emerald-500',
  },
};

const ESTILO_POR_DEFECTO = ESTILO_TRAMO.holgado;

/** "vence en 3 días" / "venció hace 5 días" / "vence hoy", en palabras. */
function textoDeDias(dias: number): string {
  if (dias < 0) return `Venció hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'}`;
  if (dias === 0) return 'Vence hoy';
  return `Vence en ${dias} ${dias === 1 ? 'día' : 'días'}`;
}

function formatearFecha(fecha: string): string {
  // Se parte el texto en vez de usar new Date(): "2026-09-03" se interpreta
  // como UTC y en nuestra zona retrocede un día.
  const [anio, mes, dia] = fecha.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

function nombreProveedor(d: DocumentoPorCaducar): string {
  return d.nombre_comercial?.trim() || d.razon_social?.trim() || 'Proveedor sin ficha completada';
}

function ReporteCaducidadContenido() {
  const [busqueda, setBusqueda] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['reporte-caducidad-documentos'],
    queryFn: reportesApi.obtenerReporteCaducidad,
  });

  const documentosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return data?.documentos ?? [];

    return (data?.documentos ?? []).filter(
      (d) =>
        nombreProveedor(d).toLowerCase().includes(texto) ||
        d.documento.toLowerCase().includes(texto) ||
        (d.ruc ?? '').toLowerCase().includes(texto)
    );
  }, [data, busqueda]);

  /** Documentos de cada tramo, en el orden de urgencia que manda el backend. */
  const porTramo = useMemo(() => {
    return (data?.tramos ?? []).map((tramo) => ({
      ...tramo,
      documentos: documentosFiltrados.filter((d) => d.tramo === tramo.clave),
    }));
  }, [data, documentosFiltrados]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  const total = documentosFiltrados.length;
  const requierenAccion = documentosFiltrados.filter((d) => d.dias_restantes <= 15).length;

  return (
    <div className="max-w-6xl mx-auto w-full space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-brand-900 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-700">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          Caducidad de documentos
        </h1>
        <p className="text-brand-900/50 text-xs mt-0.5">
          Documentos de proveedores con fecha de vencimiento, ordenados por urgencia. Los que no caducan
          (como el RUC) no aparecen.
        </p>
      </div>

      {/* Resumen: cuántos hay en cada tramo, para ver la foto sin bajar */}
      <Card>
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
          <h2 className="font-display text-sm font-semibold text-brand-900">Resumen</h2>
          <p className="text-xs text-brand-900/55">
            {total} documento{total === 1 ? '' : 's'} con vencimiento
            {requierenAccion > 0 && (
              <>
                {' · '}
                <strong className="text-brand-wine">{requierenAccion} requiere{requierenAccion === 1 ? '' : 'n'} acción</strong>
              </>
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {porTramo.map((tramo) => {
            const estilo = ESTILO_TRAMO[tramo.clave] ?? ESTILO_POR_DEFECTO;
            const cantidad = tramo.documentos.length;

            return (
              <div
                key={tramo.clave}
                className={`rounded-lg border p-3 ${estilo.chip} ${cantidad === 0 ? 'opacity-45' : ''}`}
                title={tramo.descripcion}
              >
                <p className="text-2xl font-bold tabular-nums leading-none">{cantidad}</p>
                <p className="text-[11px] font-medium mt-1.5 leading-tight">{tramo.etiqueta}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <Input
        label="Buscar"
        placeholder="Proveedor, RUC o nombre del documento"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {total === 0 ? (
        <Card>
          <p className="text-sm text-brand-900/55 text-center py-10">
            {busqueda
              ? 'Ningún documento coincide con la búsqueda.'
              : 'No hay documentos con fecha de vencimiento registrada.'}
          </p>
        </Card>
      ) : (
        porTramo
          // Un tramo vacío no aporta nada en el listado: ya se ve en el
          // resumen de arriba con su cero.
          .filter((tramo) => tramo.documentos.length > 0)
          .map((tramo) => {
            const estilo = ESTILO_TRAMO[tramo.clave] ?? ESTILO_POR_DEFECTO;

            return (
              <Card key={tramo.clave} className="overflow-hidden p-0">
                <div className="flex items-center gap-2.5 px-5 py-3 border-b border-brand-900/8">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${estilo.punto}`} aria-hidden="true" />
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-semibold text-brand-900">
                      {tramo.etiqueta}{' '}
                      <span className="text-brand-900/45 font-normal">({tramo.documentos.length})</span>
                    </h3>
                    <p className="text-[11px] text-brand-900/50">{tramo.descripcion}</p>
                  </div>
                </div>

                <ul>
                  {tramo.documentos.map((d) => (
                    <li
                      key={d.id_documento_proveedor}
                      className={`flex items-center gap-3 px-5 py-3 border-l-4 ${estilo.borde} border-b border-brand-900/5 last:border-b-0`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-brand-900 truncate">{nombreProveedor(d)}</p>
                        <p className="text-xs text-brand-900/60 truncate">
                          {d.documento}
                          {d.ruc && <span className="text-brand-900/40"> · {d.ruc}</span>}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-brand-900 tabular-nums">
                          {formatearFecha(d.fecha_caducidad)}
                        </p>
                        <p className="text-xs text-brand-900/60">{textoDeDias(d.dias_restantes)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })
      )}
    </div>
  );
}

/** Admin, Calidad y Sistemas (el backend lo vuelve a validar). */
export default function ReporteCaducidadDocumentosPage() {
  const { esSistemas, esAdmin, esCalidad } = useAuth();

  return (
    <RoleRoute allow={esSistemas || esAdmin || esCalidad}>
      <ReporteCaducidadContenido />
    </RoleRoute>
  );
}
