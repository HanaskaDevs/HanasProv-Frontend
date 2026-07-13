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
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                    <h1 className="font-display text-xl font-semibold text-brand-900">Pedidos</h1>
                    <p className="text-brand-900/50 text-xs mt-0.5">Seguimiento de tus pedidos de compra.</p>
                </div>
                <div className="flex gap-2">
                    {seleccionados.size > 0 && (
                        <Button
                            variant="secondary"
                            className="text-xs px-3 py-1.5"
                            isLoading={descargarSeleccionados.isPending}
                            onClick={() => descargarSeleccionados.mutate()}
                        >
                            Descargar {seleccionados.size}
                        </Button>
                    )}
                    <Button className="text-xs px-3 py-1.5" onClick={() => actualizar.mutate()} isLoading={actualizar.isPending}>
                        Actualizar pedidos
                    </Button>
                </div>
            </div>

            <PanelEstadisticas {...estadisticas} />

            {mensaje && <p className="text-xs text-emerald-700">{mensaje}</p>}

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
                        <span className="ml-1.5 text-xs text-brand-900/30">
                            {t === 'Abierto' ? estadisticas.totalAbiertos : estadisticas.totalCerrados}
                        </span>
                    </button>
                ))}
            </div>

            <BarraBusqueda valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar por número de pedido..." />

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
    const { esProveedor } = useAuth();

    if (!esProveedor) {
        return <ProximamentePage titulo="Pedidos" />;
    }

    return <PedidosProveedor />;
}