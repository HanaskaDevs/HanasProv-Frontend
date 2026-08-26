import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import * as pedidosInternosApi from '../api/pedidosInternosApi';
import type { FiltrosPedidosInternos } from '../types';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Spinner from '../../../shared/components/Spinner';
import Paginacion from '../../../shared/components/Paginacion';
import ProximamentePage from '../../../shared/pages/ProximamentePage';
import FilaPedidoInterno from '../components/FilaPedidoInterno';

const PEDIDOS_POR_PAGINA = 20;

/** Acento visual por bodega, usando la paleta de marca existente. */
const ACENTOS: Record<string, { dot: string; borderActivo: string; chipActivo: string }> = {
    'CD-0001': { dot: 'bg-brand-700', borderActivo: 'border-brand-700', chipActivo: 'bg-brand-700 text-white' },
    'CD-0002': { dot: 'bg-brand-wine', borderActivo: 'border-brand-wine', chipActivo: 'bg-brand-wine text-white' },
    'CD-0003': { dot: 'bg-brand-yellow', borderActivo: 'border-brand-yellow', chipActivo: 'bg-brand-yellow text-brand-900' },
};

export default function PedidosInternosPage() {
    const { puedeGestionarRecepciones } = useAuth();
    // Se usa puedeGestionarRecepciones del contexto y NO una condición
    // propia. Acá había `esAdmin || esCompras`, que se olvidaba de Sistemas:
    // PedidosPage lo dejaba entrar (su condición sí incluía Sistemas) y esta
    // pantalla le respondía "módulo en construcción". El backend
    // (PedidoInternoService) siempre le dio acceso a Sistemas, así que era
    // solo esta copia desincronizada.
    const tieneAcceso = puedeGestionarRecepciones;

    const [bodega, setBodega] = useState<string | null>(null);
    const [pagina, setPagina] = useState(1);
    const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

    const [filtrosAplicados, setFiltrosAplicados] = useState<FiltrosPedidosInternos>({});
    const [formFiltros, setFormFiltros] = useState<FiltrosPedidosInternos>({});

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['pedidos-internos-por-bodega', filtrosAplicados],
        queryFn: () => pedidosInternosApi.listarPedidosPorBodega(filtrosAplicados),
        enabled: tieneAcceso,
    });

    // Bodegas que este usuario puede ver: las que el backend haya devuelto
    // (Admin/Sistemas siempre trae las 3; Compras solo las asignadas).
    const bodegasDisponibles = useMemo(() => Object.keys(data ?? {}), [data]);

    // Si la bodega seleccionada ya no está disponible (primera carga, o un
    // Compras con solo 1-2 asignadas), cae a la primera disponible.
    useEffect(() => {
        if (bodegasDisponibles.length === 0) {
            setBodega(null);
        } else if (!bodega || !bodegasDisponibles.includes(bodega)) {
            setBodega(bodegasDisponibles[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bodegasDisponibles]);

    const pedidosBodega = bodega ? data?.[bodega]?.pedidos ?? [] : [];

    const totalPaginas = Math.max(1, Math.ceil(pedidosBodega.length / PEDIDOS_POR_PAGINA));
    const pedidosPagina = useMemo(() => {
        const inicio = (pagina - 1) * PEDIDOS_POR_PAGINA;
        return pedidosBodega.slice(inicio, inicio + PEDIDOS_POR_PAGINA);
    }, [pedidosBodega, pagina]);

    useEffect(() => {
        setPagina(1);
    }, [bodega, filtrosAplicados]);

    if (!tieneAcceso) {
        return <ProximamentePage titulo="Pedidos" />;
    }

    function alternarExpandido(nroPedido: string) {
        setExpandidos((prev) => {
            const nuevo = new Set(prev);
            if (nuevo.has(nroPedido)) nuevo.delete(nroPedido);
            else nuevo.add(nroPedido);
            return nuevo;
        });
    }

    function aplicarFiltros() {
        setFiltrosAplicados(formFiltros);
    }

    function limpiarFiltros() {
        setFormFiltros({});
        setFiltrosAplicados({});
    }

    const hayFiltrosActivos = Object.values(filtrosAplicados).some((v) => !!v);

    return (
        <div className="space-y-4 max-w-6xl mx-auto">
            <div>
                <h1 className="font-display text-xl font-semibold text-brand-900 flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-700">
                        <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
                        <rect x="9" y="11" width="14" height="10" rx="2" />
                        <path d="M13 15.5h4M13 18.5h2" />
                    </svg>
                    Pedidos por bodega
                </h1>
                <p className="text-brand-900/50 text-xs mt-0.5">Pedidos de todos los proveedores, por bodega.</p>
            </div>

            {/* Filtros */}
            <Card className="p-3.5">
                <div className="flex items-end gap-3 flex-wrap">
                    <Input
                        label="Desde"
                        type="date"
                        className="py-1.5"
                        value={formFiltros.fecha_desde ?? ''}
                        onChange={(e) => setFormFiltros((f) => ({ ...f, fecha_desde: e.target.value }))}
                    />
                    <Input
                        label="Hasta"
                        type="date"
                        className="py-1.5"
                        value={formFiltros.fecha_hasta ?? ''}
                        onChange={(e) => setFormFiltros((f) => ({ ...f, fecha_hasta: e.target.value }))}
                    />
                    <Input
                        label="Proveedor"
                        type="text"
                        placeholder="Nombre o RUC"
                        className="py-1.5 w-52"
                        value={formFiltros.proveedor ?? ''}
                        onChange={(e) => setFormFiltros((f) => ({ ...f, proveedor: e.target.value }))}
                    />
                    <Input
                        label="Producto"
                        type="text"
                        placeholder="Código o descripción"
                        className="py-1.5 w-52"
                        value={formFiltros.producto ?? ''}
                        onChange={(e) => setFormFiltros((f) => ({ ...f, producto: e.target.value }))}
                    />
                    <Button className="text-xs px-3 py-2" onClick={aplicarFiltros} isLoading={isFetching}>
                        Aplicar filtros
                    </Button>
                    {hayFiltrosActivos && (
                        <Button variant="ghost" className="text-xs px-3 py-2" onClick={limpiarFiltros}>
                            Limpiar
                        </Button>
                    )}
                </div>
            </Card>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Spinner className="h-6 w-6" />
                </div>
            ) : bodegasDisponibles.length === 0 ? (
                <Card>
                    <p className="text-sm text-brand-900/60 text-center py-10">
                        Todavía no tienes ninguna bodega asignada. Pide a Sistemas que te asigne al menos una en tu usuario.
                    </p>
                </Card>
            ) : (
                <>
                    {/* Tabs de bodega */}
                    <div className="flex items-center gap-1 border-b border-brand-900/10">
                        {bodegasDisponibles.map((cod) => {
                            const activa = bodega === cod;
                            const acento = ACENTOS[cod] ?? ACENTOS['CD-0001'];
                            const infoBodega = data?.[cod];
                            const total = infoBodega?.pedidos.length ?? 0;
                            const porcentaje = infoBodega?.porcentaje_entrega ?? 0;

                            return (
                                <button
                                    key={cod}
                                    onClick={() => setBodega(cod)}
                                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                                        activa ? `${acento.borderActivo} text-brand-900` : 'border-transparent text-brand-900/40 hover:text-brand-900/70'
                                    }`}
                                >
                                    <span className={`h-2 w-2 rounded-full ${acento.dot}`} />
                                    {cod}
                                    <span className={`text-[12px] px-1.5 py-0.5 rounded-full ${
                                        activa ? acento.chipActivo : 'bg-brand-900/8 text-brand-900/40'
                                    }`}>
                                        {total}
                                    </span>
                                    {total > 0 && (
                                        <span className="text-[12px] text-brand-900/40">{porcentaje}% entregado</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Contenido */}
                    {pedidosBodega.length === 0 ? (
                        <Card>
                            <p className="text-sm text-brand-900/60 text-center py-10">
                                No hay pedidos en {bodega} con los filtros actuales.
                            </p>
                        </Card>
                    ) : (
                        <>
                            <Card className="p-0 overflow-hidden">
                                <div className="divide-y divide-brand-900/6">
                                    {pedidosPagina.map((pedido) => (
                                        <FilaPedidoInterno
                                            key={pedido.nro_pedido}
                                            pedido={pedido}
                                            expandido={expandidos.has(pedido.nro_pedido)}
                                            onExpandir={() => alternarExpandido(pedido.nro_pedido)}
                                        />
                                    ))}
                                </div>
                            </Card>

                            <Paginacion paginaActual={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
                        </>
                    )}
                </>
            )}
        </div>
    );
}