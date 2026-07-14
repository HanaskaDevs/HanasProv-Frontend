import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import * as pedidosApi from '../api/pedidosApi';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import Paginacion from '../../../shared/components/Paginacion';
import ProximamentePage from '../../../shared/pages/ProximamentePage';
import FilaPedido from '../components/FilaPedido';
import PanelEstadisticas from '../components/PanelEstadisticas';
import PedidosInternosPage from '../../pedidosInternos/pages/PedidosInternosPage';

const PEDIDOS_POR_PAGINA = 20;

function esUrgente(fechaEsperada: string | null): 'vencido' | 'proximo' | null {
    if (!fechaEsperada) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const esperada = new Date(fechaEsperada + 'T00:00:00');
    const diffDias = Math.round((esperada.getTime() - hoy.getTime()) / 86400000);
    if (diffDias < 0) return 'vencido';
    if (diffDias <= 1) return 'proximo';
    return null;
}

function PedidosProveedor() {
    const queryClient = useQueryClient();
    const [tab, setTab] = useState<'Abierto' | 'Cerrado'>('Abierto');
    const [busqueda, setBusqueda] = useState('');
    const [mensaje, setMensaje] = useState<string | null>(null);
    const [pagina, setPagina] = useState(1);
    const [expandidos, setExpandidos] = useState<Set<number>>(new Set());
    const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());

    const { data: abiertos, isLoading: cargandoAbiertos } = useQuery({
        queryKey: ['pedidos-abiertos'],
        queryFn: pedidosApi.listarPedidosAbiertos,
    });

    const { data: cerrados, isLoading: cargandoCerrados } = useQuery({
        queryKey: ['pedidos-cerrados'],
        queryFn: pedidosApi.listarPedidosCerrados,
    });

    const actualizar = useMutation({
        mutationFn: pedidosApi.actualizarPedidos,
        onSuccess: (res) => {
            setMensaje(res.message);
            queryClient.invalidateQueries({ queryKey: ['pedidos-abiertos'] });
        },
    });

    const descargarSeleccionados = useMutation({
        mutationFn: () => pedidosApi.descargarPedidosPdf(Array.from(seleccionados)),
    });

    const datosTab = tab === 'Abierto' ? abiertos : cerrados;
    const cargando = tab === 'Abierto' ? cargandoAbiertos : cargandoCerrados;

    const pedidosFiltrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        return (datosTab ?? []).filter((p) => !texto || p.nro_pedido.toLowerCase().includes(texto));
    }, [datosTab, busqueda]);

    const totalPaginas = Math.max(1, Math.ceil(pedidosFiltrados.length / PEDIDOS_POR_PAGINA));

    const pedidosPagina = useMemo(() => {
        const inicio = (pagina - 1) * PEDIDOS_POR_PAGINA;
        return pedidosFiltrados.slice(inicio, inicio + PEDIDOS_POR_PAGINA);
    }, [pedidosFiltrados, pagina]);

    useEffect(() => {
        setPagina(1);
        setSeleccionados(new Set());
    }, [busqueda, tab]);

    const estadisticas = useMemo(() => {
        const listaAbiertos = abiertos ?? [];
        let vencidos = 0;
        let proximos = 0;
        for (const p of listaAbiertos) {
            const u = esUrgente(p.fecha_recepcion_esperada);
            if (u === 'vencido') vencidos++;
            if (u === 'proximo') proximos++;
        }
        return {
            totalAbiertos: listaAbiertos.length,
            totalCerrados: (cerrados ?? []).length,
            vencidos,
            proximos,
        };
    }, [abiertos, cerrados]);

    function alternarExpandido(id: number) {
        setExpandidos((prev) => {
            const nuevo = new Set(prev);
            if (nuevo.has(id)) nuevo.delete(id);
            else nuevo.add(id);
            return nuevo;
        });
    }

    function alternarSeleccionado(id: number) {
        setSeleccionados((prev) => {
            const nuevo = new Set(prev);
            if (nuevo.has(id)) nuevo.delete(id);
            else nuevo.add(id);
            return nuevo;
        });
    }

    return (
        <div className="space-y-4">

            {/* Encabezado */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                    <h1 className="font-display text-xl font-semibold text-brand-900 flex items-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-700">
                            <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
                            <rect x="9" y="11" width="14" height="10" rx="2" />
                            <path d="M13 15.5h4M13 18.5h2" />
                        </svg>
                        Pedidos de compra
                    </h1>
                    <p className="text-brand-900/50 text-xs mt-0.5">Seguimiento de tus órdenes activas y cerradas.</p>
                </div>
                <div className="flex gap-2">
                    {seleccionados.size > 0 && (
                        <Button
                            variant="secondary"
                            className="text-xs px-3 py-1.5"
                            isLoading={descargarSeleccionados.isPending}
                            onClick={() => descargarSeleccionados.mutate()}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            Descargar {seleccionados.size}
                        </Button>
                    )}
                    <Button className="text-xs px-3 py-1.5" onClick={() => actualizar.mutate()} isLoading={actualizar.isPending}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                        Actualizar pedidos
                    </Button>
                </div>
            </div>

            {/* Estadísticas */}
            <PanelEstadisticas {...estadisticas} />

            {/* Mensaje de éxito al actualizar */}
            {mensaje && (
                <p className="text-xs text-emerald-700 flex items-center gap-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {mensaje}
                </p>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-brand-900/10">
                {(['Abierto', 'Cerrado'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                            tab === t
                                ? 'border-brand-700 text-brand-900'
                                : 'border-transparent text-brand-900/40 hover:text-brand-900/70'
                        }`}
                    >
                        {t === 'Abierto' ? 'Abiertos' : 'Cerrados'}
                        <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                            tab === t
                                ? 'bg-brand-700 text-white'
                                : 'bg-brand-900/8 text-brand-900/40'
                        }`}>
                            {t === 'Abierto' ? estadisticas.totalAbiertos : estadisticas.totalCerrados}
                        </span>
                    </button>
                ))}
            </div>

            {/* Búsqueda */}
            <BarraBusqueda valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar por número de pedido..." />

            {/* Contenido */}
            {cargando ? (
                <div className="flex justify-center py-12">
                    <Spinner className="h-6 w-6" />
                </div>
            ) : pedidosFiltrados.length === 0 ? (
                <Card>
                    <p className="text-sm text-brand-900/60 text-center py-10">
                        {(datosTab ?? []).length === 0
                            ? tab === 'Abierto'
                                ? 'No tienes pedidos abiertos. Presiona "Actualizar pedidos" para traer los más recientes.'
                                : 'Todavía no tienes pedidos cerrados.'
                            : 'Sin resultados para tu búsqueda.'}
                    </p>
                </Card>
            ) : (
                <>
                    <Card className="p-0 overflow-hidden">
                        {/* Encabezados de columna */}
                        <div
                            className="grid text-[10px] font-medium uppercase tracking-wider text-brand-900/40 px-4 py-2 bg-brand-900/[0.02] border-b border-brand-900/6"
                            style={{ gridTemplateColumns: '16px 28px 1fr 130px 130px 90px 44px 32px', gap: '10px' }}
                        >
                            <span />
                            <span />
                            <span>Pedido</span>
                            <span>Registro BC</span>
                            <span>Recepción esp.</span>
                            <span>Estado</span>
                            <span>Ítems</span>
                            <span />
                        </div>

                        <div className="divide-y divide-brand-900/6">
                            {pedidosPagina.map((pedido) => (
                                <FilaPedido
                                    key={pedido.id_pedido_compra}
                                    pedido={pedido}
                                    expandido={expandidos.has(pedido.id_pedido_compra)}
                                    onExpandir={() => alternarExpandido(pedido.id_pedido_compra)}
                                    seleccionado={seleccionados.has(pedido.id_pedido_compra)}
                                    onSeleccionar={() => alternarSeleccionado(pedido.id_pedido_compra)}
                                />
                            ))}
                        </div>
                    </Card>

                    <Paginacion paginaActual={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
                </>
            )}
        </div>
    );
}

export default function PedidosPage() {
    const { esProveedor, puedeGestionarRecepciones } = useAuth();

    if (esProveedor) {
        return <PedidosProveedor />;
    }

    if (puedeGestionarRecepciones) {
        return <PedidosInternosPage />;
    }

    return <ProximamentePage titulo="Pedidos" />;
}