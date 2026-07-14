import * as pedidosInternosApi from '../api/pedidosInternosApi';
import type { LineaPedidoInterno } from '../types';

function formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function HistorialRecepciones({ lineas }: { lineas: LineaPedidoInterno[] }) {
    if (!lineas || lineas.length === 0) {
        return (
            <div className="rounded-lg border border-brand-900/8 bg-white px-3 py-4 text-sm text-brand-900/50 text-center">
                Este pedido no tiene líneas.
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-brand-900/8 overflow-hidden bg-white divide-y divide-brand-900/6">
            {lineas.map((linea) => {
                const cantidadPedida = Number(linea.cantidad_pedida) || 0;
                const cantidadRecibida = Number(linea.cantidad_recibida) || 0;
                const pendiente = Math.max(0, cantidadPedida - cantidadRecibida);
                const completa = pendiente === 0;
                const recepciones = linea.recepciones ?? [];

                return (
                    <div key={linea.id_detalle_pedido_compra} className="px-3 py-2.5">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-mono text-xs text-brand-900/50 w-24 truncate">{linea.codigo_producto}</span>
                            <span className="text-sm text-brand-900/80 flex-1 min-w-[120px] truncate">{linea.descripcion ?? '—'}</span>
                            <span className="text-xs text-brand-900/60">
                                <span className="font-medium text-brand-900">{cantidadRecibida}</span> / {cantidadPedida}
                            </span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                completa ? 'bg-emerald-50 text-emerald-700' : 'bg-brand-yellow/20 text-amber-700'
                            }`}>
                                {completa ? 'Completa' : `Faltan ${pendiente}`}
                            </span>
                        </div>

                        {recepciones.length > 0 && (
                            <div className="mt-2 pl-2 border-l-2 border-brand-900/8 space-y-2">
                                {recepciones.map((rec) => (
                                    <div key={rec.id_recepcion_pedido_detalle} className="text-xs">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-brand-900/50">{formatearFecha(rec.fecha_recepcion)}</span>
                                            <span className="text-brand-900/40">·</span>
                                            <span className="text-brand-900/70">{rec.registrado_por ?? '—'}</span>
                                            <span className="font-medium text-brand-900">{rec.cantidad_recibida} recibido(s)</span>
                                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                                                rec.recepcion_completa ? 'bg-emerald-50 text-emerald-700' : 'bg-brand-yellow/20 text-amber-700'
                                            }`}>
                                                {rec.recepcion_completa ? 'Recepción completa' : 'Parcial'}
                                            </span>
                                        </div>

                                        {rec.observacion && (
                                            <p className="text-brand-900/60 mt-1 italic">"{rec.observacion}"</p>
                                        )}

                                        {(rec.imagenes ?? []).length > 0 && (
                                            <div className="flex gap-2 mt-1.5">
                                                {rec.imagenes.map((img) => (
                                                    <button
                                                        key={img.id_recepcion_imagen}
                                                        onClick={() => pedidosInternosApi.verImagenRecepcion(img.id_recepcion_imagen)}
                                                        className="text-[11px] px-2 py-1 rounded-md bg-brand-700/8 text-brand-700 hover:bg-brand-700/15 flex items-center gap-1"
                                                    >
                                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
                                                        </svg>
                                                        Ver imagen
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}