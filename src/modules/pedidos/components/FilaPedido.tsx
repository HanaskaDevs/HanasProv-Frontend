import { useMutation } from '@tanstack/react-query';
import * as pedidosApi from '../api/pedidosApi';
import type { PedidoCompra } from '../types';
import Spinner from '../../../shared/components/Spinner';

function formatearFechaCorta(fecha: string | null): string {
    if (!fecha) return '—';
    const d = new Date(fecha + 'T00:00:00');
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
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

const ESTILOS_URGENCIA: Record<string, { barra: string; punto: string }> = {
    vencido: { barra: 'bg-brand-wine', punto: 'bg-brand-wine' },
    proximo: { barra: 'bg-brand-yellow', punto: 'bg-brand-yellow' },
    normal: { barra: 'bg-brand-700', punto: 'bg-brand-700' },
    sin_fecha: { barra: 'bg-brand-900/15', punto: 'bg-brand-900/20' },
};

function IconoDescargar() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );
}

function IconoChevron({ abierto }: { abierto: boolean }) {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
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
    const estilo = ESTILOS_URGENCIA[estado];

    return (
        <div className="relative">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${estilo.barra}`} />

            <div className="flex items-center gap-3 pl-4 pr-3 py-2.5 hover:bg-brand-200/10 transition-colors group">
                <input
                    type="checkbox"
                    checked={seleccionado}
                    onChange={onSeleccionar}
                    className="h-4 w-4 shrink-0 accent-brand-700 cursor-pointer"
                />

                <button
                    onClick={onExpandir}
                    className="h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-brand-900/40
            hover:bg-brand-900/8 hover:text-brand-900 transition-colors"
                >
                    <IconoChevron abierto={expandido} />
                </button>

                <button onClick={onExpandir} className="flex-1 flex items-center gap-3 flex-wrap text-left min-w-0 py-0.5">
                    <span className="font-mono text-[13px] font-semibold text-brand-900 tracking-tight">
                        {pedido.nro_pedido}
                    </span>

                    {pedido.estado === 'Cerrado' && (
                        <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                            Cerrado
                        </span>
                    )}

                    <span className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wide text-brand-900/35">Pedido</span>
                        <span className="text-xs font-medium text-brand-900/70">
                            {formatearFechaCorta(pedido.fecha_registro_bc)}
                        </span>
                    </span>

                    <span className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${estilo.punto}`} />
                        <span className="text-[10px] uppercase tracking-wide text-brand-900/35">Recepción</span>
                        <span className="text-xs font-medium text-brand-900/70">
                            {formatearFechaCorta(pedido.fecha_recepcion_esperada)}
                        </span>
                    </span>

                    <span className="text-[11px] text-brand-900/30">
                        {pedido.lineas.length} {pedido.lineas.length === 1 ? 'ítem' : 'ítems'}
                    </span>
                </button>

                <button
                    onClick={() => descargar.mutate()}
                    disabled={descargar.isPending}
                    title="Descargar PDF"
                    className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-brand-900/40
            hover:bg-brand-700/10 hover:text-brand-700 transition-colors opacity-0 group-hover:opacity-100"
                >
                    {descargar.isPending ? <Spinner className="h-3.5 w-3.5" /> : <IconoDescargar />}
                </button>
            </div>

            {expandido && (
                <div className="pl-12 pr-4 pb-3 bg-brand-200/5">
                    <div className="rounded-lg border border-brand-900/8 divide-y divide-brand-900/6 overflow-hidden bg-white">
                        {pedido.lineas.map((linea) => (
                            <div key={linea.nro_linea} className="flex items-center gap-3 px-3 py-2 text-xs">
                                <span className="font-mono text-brand-900/50 shrink-0 w-24 truncate">
                                    {linea.codigo_producto}
                                </span>
                                <span className="flex-1 text-brand-900/80 truncate">{linea.descripcion ?? '—'}</span>
                                <span className="font-medium text-brand-900 shrink-0">{linea.cantidad}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}