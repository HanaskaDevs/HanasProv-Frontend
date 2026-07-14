import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as pedidosInternosApi from '../api/pedidosInternosApi';
import type { PedidoInterno } from '../types';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import Paginacion from '../../../shared/components/Paginacion';
import FilaPedidoInterno from '../components/FilaPedidoInterno';
import ModalRegistrarRecepcion from '../components/ModalRegistrarRecepcion';

const PEDIDOS_POR_PAGINA = 20;

export default function PedidosInternosPage() {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<'Abierto' | 'Cerrado'>('Abierto');
    const [busqueda, setBusqueda] = useState('');
    const [pagina, setPagina] = useState(1);
    const [expandidos, setExpandidos] = useState<Set<number>>(new Set());
    const [pedidoParaRecepcion, setPedidoParaRecepcion] = useState<PedidoInterno | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['pedidos-internos', tab, busqueda],
        queryFn: () => pedidosInternosApi.listarPedidosInternos(tab, busqueda || undefined),
    });

    const cerrarPedido = useMutation({
        mutationFn: pedidosInternosApi.cerrarPedidoInterno,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pedidos-internos'] }),
    });

    const totalPaginas = Math.max(1, Math.ceil((data?.length ?? 0) / PEDIDOS_POR_PAGINA));

    const pedidosPagina = useMemo(() => {
        const inicio = (pagina - 1) * PEDIDOS_POR_PAGINA;
        return (data ?? []).slice(inicio, inicio + PEDIDOS_POR_PAGINA);
    }, [data, pagina]);

    useEffect(() => {
        setPagina(1);
    }, [busqueda, tab]);

    function alternarExpandido(id: number) {
        setExpandidos((prev) => {
            const nuevo = new Set(prev);
            if (nuevo.has(id)) nuevo.delete(id);
            else nuevo.add(id);
            return nuevo;
        });
    }

    async function abrirRecepcion(idPedido: number) {
        const detalle = await pedidosInternosApi.obtenerPedidoInterno(idPedido);
        setPedidoParaRecepcion(detalle);
    }

    return (
        <div className="space-y-4">
            <div>
                <h1 className="font-display text-xl font-semibold text-brand-900 flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-700">
                        <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
                        <rect x="9" y="11" width="14" height="10" rx="2" />
                        <path d="M13 15.5h4M13 18.5h2" />
                    </svg>
                    Pedidos
                </h1>
                <p className="text-brand-900/50 text-xs mt-0.5">Registra recepciones y cierra pedidos de los proveedores.</p>
            </div>

            <div className="flex items-center gap-1 border-b border-brand-900/10">
                {(['Abierto', 'Cerrado'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t
                                ? 'border-brand-700 text-brand-900'
                                : 'border-transparent text-brand-900/40 hover:text-brand-900/70'
                            }`}
                    >
                        {t === 'Abierto' ? 'Abiertos' : 'Cerrados'}
                    </button>
                ))}
            </div>

            <BarraBusqueda valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar por número de pedido o proveedor..." />

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Spinner className="h-6 w-6" />
                </div>
            ) : (data ?? []).length === 0 ? (
                <Card>
                    <p className="text-sm text-brand-900/60 text-center py-10">
                        {tab === 'Abierto' ? 'No hay pedidos abiertos.' : 'No hay pedidos cerrados.'}
                    </p>
                </Card>
            ) : (
                <>
                    <Card className="p-0 overflow-hidden">
                        <div className="divide-y divide-brand-900/6">
                            {pedidosPagina.map((pedido) => (
                                <FilaPedidoInterno
                                    key={pedido.id_pedido_compra}
                                    pedido={pedido}
                                    expandido={expandidos.has(pedido.id_pedido_compra)}
                                    onExpandir={() => alternarExpandido(pedido.id_pedido_compra)}
                                    onAbrirRecepcion={() => abrirRecepcion(pedido.id_pedido_compra)}
                                    onCerrarPedido={() => cerrarPedido.mutate(pedido.id_pedido_compra)}
                                    cerrando={cerrarPedido.isPending}
                                />
                            ))}
                        </div>
                    </Card>

                    <Paginacion paginaActual={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
                </>
            )}

            {pedidoParaRecepcion && (
                <ModalRegistrarRecepcion pedido={pedidoParaRecepcion} onClose={() => setPedidoParaRecepcion(null)} />
            )}
        </div>
    );
}