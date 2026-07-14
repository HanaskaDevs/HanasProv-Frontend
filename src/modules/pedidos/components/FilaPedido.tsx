import { useMutation } from '@tanstack/react-query';
import * as pedidosApi from '../api/pedidosApi';
import type { PedidoCompra } from '../types';
import Spinner from '../../../shared/components/Spinner';

function formatearFecha(fecha: string | null): string {
    if (!fecha) return '—';
    const d = new Date(fecha + 'T00:00:00');
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
}

function urgencia(fechaEsperada: string | null, cerrado: boolean): 'vencido' | 'proximo' | 'normal' | 'sin_fecha' {
    if (cerrado) return 'normal';
    if (!fechaEsperada) return 'sin_fecha';
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const esperada = new Date(fechaEsperada + 'T00:00:00');
    const diffDias = Math.round((esperada.getTime() - hoy.getTime()) / 86400000);
    if (diffDias < 0) return 'vencido';
    if (diffDias <= 1) return 'proximo';
    return 'normal';
}

const CONFIG_URGENCIA = {
    vencido:   { barra: 'bg-brand-wine',      fecha: 'text-brand-wine font-medium',   badge: 'bg-brand-wine/10 text-brand-wine',     label: 'Vencido' },
    proximo:   { barra: 'bg-brand-yellow',     fecha: 'text-amber-700 font-medium',    badge: 'bg-brand-yellow/20 text-amber-700',    label: 'Por vencer' },
    normal:    { barra: 'bg-brand-700',        fecha: 'text-brand-900/60',             badge: '',                                     label: '' },
    sin_fecha: { barra: 'bg-brand-900/15',     fecha: 'text-brand-900/40',             badge: '',                                     label: '' },
};

function IconoDescargar() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );
}

function IconoChevron({ abierto }: { abierto: boolean }) {
    return (
        <svg
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform duration-200 ${abierto ? 'rotate-90' : ''}`}
        >
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
}

export default function FilaPedido({
    pedido,
    seleccionado,
    onSeleccionar,
    expandido,
    onExpandir,
}: {
    pedido: PedidoCompra;
    seleccionado: boolean;
    onSeleccionar: () => void;
    expandido: boolean;
    onExpandir: () => void;
}) {
    const descargar = useMutation({
        mutationFn: () => pedidosApi.descargarPedidosPdf([pedido.id_pedido_compra]),
    });

    const estado = urgencia(pedido.fecha_recepcion_esperada, pedido.estado === 'Cerrado');
    const cfg = CONFIG_URGENCIA[estado];

    return (
        <div className="relative">
            <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${cfg.barra}`} />

            <div className="grid items-center gap-2.5 pl-4 pr-3 py-2.5 hover:bg-brand-900/[0.02] transition-colors group"
                style={{ gridTemplateColumns: '16px 28px 1fr 130px 130px 90px 44px 32px' }}>

                {/* checkbox */}
                <input
                    type="checkbox"
                    checked={seleccionado}
                    onChange={onSeleccionar}
                    className="h-4 w-4 shrink-0 accent-brand-700 cursor-pointer"
                />

                {/* chevron */}
                <button
                    onClick={onExpandir}
                    className="h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-brand-900/40 hover:bg-brand-900/8 hover:text-brand-900 transition-colors"
                >
                    <IconoChevron abierto={expandido} />
                </button>

                {/* número + badge urgencia */}
                <button onClick={onExpandir} className="text-left min-w-0">
                    <p className="font-mono text-[13px] font-semibold text-brand-900 tracking-tight truncate">
                        {pedido.nro_pedido}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        {pedido.estado === 'Cerrado' && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                                Cerrado
                            </span>
                        )}
                        {cfg.label && (
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
                                {cfg.label}
                            </span>
                        )}
                    </div>
                </button>

                {/* fecha registro */}
                <div className="text-xs text-brand-900/60 flex items-center gap-1 min-w-0">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-brand-900/30">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span className="truncate">{formatearFecha(pedido.fecha_registro_bc)}</span>
                </div>

                {/* fecha recepción esperada */}
                <div className={`text-xs flex items-center gap-1 min-w-0 ${cfg.fecha}`}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span className="truncate">{formatearFecha(pedido.fecha_recepcion_esperada)}</span>
                </div>

                {/* estado */}
                <div>
                    {pedido.estado === 'Cerrado' ? (
                        <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 inline-flex items-center gap-1">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            Cerrado
                        </span>
                    ) : estado === 'vencido' ? (
                        <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-brand-wine/10 text-brand-wine inline-flex items-center gap-1">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            Vencido
                        </span>
                    ) : (
                        <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-brand-700/10 text-brand-700 inline-flex items-center gap-1">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            Abierto
                        </span>
                    )}
                </div>

                {/* ítems */}
                <div className="text-xs text-brand-900/50 flex items-center gap-1">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                    {pedido.lineas.length}
                </div>

                {/* descargar */}
                <button
                    onClick={() => descargar.mutate()}
                    disabled={descargar.isPending}
                    title="Descargar PDF"
                    className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-brand-900/30 hover:bg-brand-700/10 hover:text-brand-700 transition-colors opacity-0 group-hover:opacity-100"
                >
                    {descargar.isPending ? <Spinner className="h-3.5 w-3.5" /> : <IconoDescargar />}
                </button>
            </div>

            {expandido && (
                <div className="pl-[72px] pr-4 pb-3 pt-1 bg-brand-900/[0.015]">
                    <div className="rounded-lg border border-brand-900/8 overflow-hidden bg-white">
                        <div className="grid text-[10px] font-medium uppercase tracking-wider text-brand-900/40 px-3 py-2 bg-brand-900/[0.02]"
                            style={{ gridTemplateColumns: '100px 1fr 60px' }}>
                            <span>Código</span>
                            <span>Descripción</span>
                            <span className="text-right">Cant.</span>
                        </div>
                        {pedido.lineas.map((linea) => (
                            <div key={linea.nro_linea}
                                className="grid items-center px-3 py-2 text-xs border-t border-brand-900/6"
                                style={{ gridTemplateColumns: '100px 1fr 60px' }}>
                                <span className="font-mono text-brand-900/50 truncate">{linea.codigo_producto}</span>
                                <span className="text-brand-900/75 truncate">{linea.descripcion ?? '—'}</span>
                                <span className="font-medium text-brand-900 text-right">{linea.cantidad}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}