import { useState } from 'react';
import type { PedidoInterno } from '../types';
import HistorialRecepciones from './HistorialRecepciones';

function formatearFecha(fecha: string | null): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
}

function IconoChevron({ abierto }: { abierto: boolean }) {
    return (
        <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
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
    onAbrirRecepcion,
    onCerrarPedido,
    cerrando,
}: {
    pedido: PedidoInterno;
    expandido: boolean;
    onExpandir: () => void;
    onAbrirRecepcion: () => void;
    onCerrarPedido: () => void;
    cerrando: boolean;
}) {
    const [confirmandoCierre, setConfirmandoCierre] = useState(false);

    const totalLineas = pedido.lineas.length;
    const lineasCompletas = pedido.lineas.filter(
        (l) => Number(l.cantidad_recibida) >= Number(l.cantidad_pedida)
    ).length;

    const totalPedido = pedido.lineas.reduce((acc, l) => acc + Number(l.cantidad_pedida), 0);
    const totalRecibido = pedido.lineas.reduce((acc, l) => acc + Number(l.cantidad_recibida), 0);
    const porcentaje = totalPedido > 0 ? Math.min(100, Math.round((totalRecibido / totalPedido) * 100)) : 0;
    const todoCompleto = lineasCompletas === totalLineas && totalLineas > 0;

    return (
        <div>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-brand-900/6 last:border-b-0">
                <button
                    onClick={onExpandir}
                    className="h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-brand-900/40 hover:bg-brand-900/8 hover:text-brand-900 transition-colors"
                >
                    <IconoChevron abierto={expandido} />
                </button>

                <button onClick={onExpandir} className="flex-1 flex items-center gap-x-6 gap-y-1.5 flex-wrap text-left min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap min-w-[220px]">
                        <span className="font-mono text-sm font-semibold text-brand-900 tracking-tight">
                            {pedido.nro_pedido}
                        </span>
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#EAF1FB] text-[#185FA5] flex items-center gap-1">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 21h18M5 21V7l8-4v18M13 21V11l6 2v8" />
                            </svg>
                            {pedido.proveedor.razon_social}
                        </span>
                        {totalLineas > 0 && (
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                todoCompleto ? 'bg-emerald-50 text-emerald-800' : 'bg-brand-yellow/20 text-amber-800'
                            }`}>
                                {lineasCompletas}/{totalLineas} completas
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-brand-900/60">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-700">
                            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span className="text-brand-900/40 text-[11px]">Registro</span> {formatearFecha(pedido.fecha_registro_bc)}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-brand-900/60">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-700">
                            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="m9 16 2 2 4-4" />
                        </svg>
                        <span className="text-brand-900/40 text-[11px]">Esperada</span> {formatearFecha(pedido.fecha_recepcion_esperada)}
                    </div>

                    {totalPedido > 0 && (
                        <div className="flex items-center gap-2 flex-1 min-w-[140px]">
                            <div className="flex-1 max-w-[160px] h-1.5 rounded-full bg-brand-900/8 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${porcentaje}%`, backgroundColor: todoCompleto ? '#3B6D11' : '#274E61' }}
                                />
                            </div>
                            <span className="text-[11px] text-brand-900/40 whitespace-nowrap">{porcentaje}% recibido</span>
                        </div>
                    )}
                </button>

                <div className="flex items-center gap-2 shrink-0">
                    {pedido.estado === 'Abierto' ? (
                        <>
                            {confirmandoCierre ? (
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => { onCerrarPedido(); setConfirmandoCierre(false); }}
                                        disabled={cerrando}
                                        className="text-[11px] font-medium px-2.5 py-1.5 rounded-md bg-brand-wine text-white whitespace-nowrap"
                                    >
                                        Confirmar cierre
                                    </button>
                                    <button
                                        onClick={() => setConfirmandoCierre(false)}
                                        className="text-[11px] font-medium px-2 py-1.5 rounded-md text-brand-900/40 hover:bg-brand-900/5"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setConfirmandoCierre(true)}
                                    className="text-[11px] font-medium px-3 py-1.5 rounded-md border border-brand-wine/30 text-brand-wine hover:bg-brand-wine/5 transition-colors whitespace-nowrap"
                                >
                                    Cerrar pedido
                                </button>
                            )}

                            <button
                                onClick={onAbrirRecepcion}
                                className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-md bg-brand-900 text-white hover:bg-brand-900/90 transition-colors whitespace-nowrap"
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2" /><path d="M2 8h20l-1.5 12.5a1 1 0 0 1-1 .9H4.5a1 1 0 0 1-1-.9L2 8Z" /><path d="M9 12h6" />
                                </svg>
                                Registrar recepción
                            </button>
                        </>
                    ) : (
                        <span className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 whitespace-nowrap">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Cerrado
                        </span>
                    )}
                </div>
            </div>

            <div
                className="grid transition-all duration-300 ease-out"
                style={{ gridTemplateRows: expandido ? '1fr' : '0fr' }}
            >
                <div className="overflow-hidden">
                    <div className="pl-12 pr-4 pb-3 pt-1 bg-brand-900/[0.015]">
                        <HistorialRecepciones lineas={pedido.lineas} />
                    </div>
                </div>
            </div>
        </div>
    );
}