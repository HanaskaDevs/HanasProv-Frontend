import type { PedidoInterno } from '../types';

function formatearFecha(fecha: string | null): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
}

function IconoChevron({ abierto }: { abierto: boolean }) {
    return (
        <svg
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform duration-200 ${abierto ? 'rotate-90' : ''}`}
        >
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
}

export default function FilaPedidoInterno({
    pedido,
    expandido,
    onExpandir,
}: {
    pedido: PedidoInterno;
    expandido: boolean;
    onExpandir: () => void;
}) {
    const completo = pedido.porcentaje_entrega >= 100;

    return (
        <div>
            <div className="flex items-start gap-3.5 px-5 py-4 hover:bg-brand-200/[0.06] transition-colors">
                <button
                    onClick={onExpandir}
                    className="h-7 w-7 mt-0.5 shrink-0 rounded-full flex items-center justify-center text-brand-900/40 hover:bg-brand-900/8 hover:text-brand-900 transition-colors"
                >
                    <IconoChevron abierto={expandido} />
                </button>

                <button onClick={onExpandir} className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                        <span className="font-mono text-base font-semibold text-brand-900 tracking-tight">
                            {pedido.nro_pedido}
                        </span>

                        {pedido.estado_pedido_bc && (
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-brand-900/6 text-brand-900/60">
                                {pedido.estado_pedido_bc}
                            </span>
                        )}

                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#EAF1FB] text-[#185FA5] flex items-center gap-1.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 21h18M5 21V7l8-4v18M13 21V11l6 2v8" />
                            </svg>
                            {pedido.proveedor ?? 'Proveedor no encontrado'}
                        </span>

                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            completo ? 'bg-emerald-50 text-emerald-800' : 'bg-brand-yellow/20 text-amber-800'
                        }`}>
                            {pedido.porcentaje_entrega}% entregado
                        </span>
                    </div>

                    <div className="flex items-center gap-5 text-sm text-brand-900/60 flex-wrap">
                        <span className="flex items-center gap-1.5">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-700">
                                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            Registro {formatearFecha(pedido.fecha_registro_bc)}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-700">
                                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="m9 16 2 2 4-4" />
                            </svg>
                            Esperada {formatearFecha(pedido.fecha_recepcion_esperada)}
                        </span>
                        <span>{pedido.lineas.length} {pedido.lineas.length === 1 ? 'ítem' : 'ítems'}</span>
                    </div>

                    <div className="flex items-center gap-2.5 mt-2.5">
                        <div className="flex-1 max-w-[220px] h-2 rounded-full bg-brand-900/8 overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${pedido.porcentaje_entrega}%`, backgroundColor: completo ? '#3B6D11' : '#274E61' }}
                            />
                        </div>
                        <span className="text-xs text-brand-900/50">{pedido.porcentaje_entrega}% entregado</span>
                    </div>
                </button>
            </div>

            <div
                className="grid transition-all duration-300 ease-out"
                style={{ gridTemplateRows: expandido ? '1fr' : '0fr' }}
            >
                <div className="overflow-hidden">
                    <div className="pl-16 pr-5 pb-4">
                        <div className="rounded-lg border border-brand-900/8 overflow-hidden bg-white">
                            <div className="grid grid-cols-[100px_1fr_70px_70px] items-center text-xs font-medium uppercase tracking-wider text-brand-900/40 px-3.5 py-2 bg-brand-900/[0.02]">
                                <span>Código</span>
                                <span>Descripción</span>
                                <span className="text-right">Pedido</span>
                                <span className="text-right">Recibido</span>
                            </div>
                            {pedido.lineas.map((linea) => (
                                <div key={linea.nro_linea}
                                    className="grid grid-cols-[100px_1fr_70px_70px] items-center px-3.5 py-2.5 text-sm border-t border-brand-900/6">
                                    <span className="font-mono text-brand-900/50 truncate">{linea.nro_producto}</span>
                                    <span className="text-brand-900/75 truncate">{linea.descripcion ?? '—'}</span>
                                    <span className="font-medium text-brand-900 text-right">{linea.cantidad}</span>
                                    <span className="font-medium text-brand-900/70 text-right">{linea.cantidad_recibida}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}