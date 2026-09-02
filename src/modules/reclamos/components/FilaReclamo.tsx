import type { ImpactoProveedor, Reclamo } from '../types';

function formatearFecha(fecha: string): string {
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
}

const COLOR_IMPACTO: Record<ImpactoProveedor, string> = {
    Alto: 'bg-red-50 text-red-800',
    Medio: 'bg-amber-50 text-amber-800',
    Bajo: 'bg-emerald-50 text-emerald-800',
};

export default function FilaReclamo({ reclamo, onAbrir }: { reclamo: Reclamo; onAbrir: () => void }) {
    return (
        <button
            onClick={onAbrir}
            className="w-full flex items-center gap-3.5 px-5 py-4 hover:bg-brand-200/[0.06] transition-colors text-left"
        >
            <div className="h-10 w-10 rounded-full bg-brand-wine/10 text-brand-wine flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            </div>

            <div className="flex-1 min-w-0">
                {/* JERARQUÍA INVERTIDA respecto de antes (1-sep-2026): lo que
                    manda ahora es el TIPO y el IMPACTO, no el título.
                    Motivo: al revisar la lista, lo primero que hay que poder
                    distinguir de un vistazo es de qué clase de problema se
                    trata y qué tan grave es; el título es texto libre y varía
                    con quien lo escribió, así que sirve para identificar el
                    caso puntual, no para clasificarlo. Por eso las dos
                    etiquetas van arriba y grandes, y el asunto pasa a una
                    segunda línea, más chico. */}
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    {reclamo.tipo_reclamo && (
                        <span className="text-sm font-bold px-3 py-1 rounded-lg bg-brand-900/10 text-brand-900">
                            {reclamo.tipo_reclamo}
                        </span>
                    )}
                    {reclamo.impacto_proveedor && (
                        <span className={`text-sm font-bold px-3 py-1 rounded-lg ${COLOR_IMPACTO[reclamo.impacto_proveedor]}`}>
                            Impacto {reclamo.impacto_proveedor}
                        </span>
                    )}
                    {reclamo.estado === 'Cerrado' && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 self-center">
                            Cerrado
                        </span>
                    )}
                </div>

                <p className="text-[13px] text-brand-900/75 truncate mb-1">{reclamo.asunto}</p>
                <div className="flex items-center gap-4 text-xs text-brand-900/60 flex-wrap">
                    <span className="flex items-center gap-1">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 21h18M5 21V7l8-4v18M13 21V11l6 2v8" />
                        </svg>
                        {reclamo.proveedor.razon_social}
                    </span>
                    <span>{formatearFecha(reclamo.fecha_creacion)}</span>
                    <span>Creado por {reclamo.creado_por.nombre_completo}</span>
                    {typeof reclamo.total_mensajes === 'number' && (
                        <span className="flex items-center gap-1">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            {reclamo.total_mensajes} {reclamo.total_mensajes === 1 ? 'mensaje' : 'mensajes'}
                        </span>
                    )}
                </div>
            </div>

            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-900/30 shrink-0">
                <polyline points="9 18 15 12 9 6" />
            </svg>
        </button>
    );
}