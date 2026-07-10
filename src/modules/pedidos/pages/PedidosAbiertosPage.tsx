import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import * as pedidosApi from '../api/pedidosApi';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import ProximamentePage from '../../../shared/pages/ProximamentePage';

function PedidosAbiertosProveedor() {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pedidos-abiertos'],
    queryFn: pedidosApi.listarPedidosAbiertos,
  });

  const actualizar = useMutation({
    mutationFn: pedidosApi.actualizarPedidos,
    onSuccess: (res) => {
      setMensaje(res.message);
      queryClient.invalidateQueries({ queryKey: ['pedidos-abiertos'] });
    },
  });

  const pedidosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return (data ?? []).filter((p) => !texto || p.nro_pedido.toLowerCase().includes(texto));
  }, [data, busqueda]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-900">Pedidos Abiertos</h1>
          <p className="text-brand-900/60 text-sm mt-1">Pedidos lanzados pendientes de recepción.</p>
        </div>
        <Button onClick={() => actualizar.mutate()} isLoading={actualizar.isPending}>
          Actualizar pedidos
        </Button>
      </div>

      {mensaje && <p className="text-sm text-emerald-700">{mensaje}</p>}

      <BarraBusqueda valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar por número de pedido..." />

      {pedidosFiltrados.length === 0 ? (
        <Card>
          <p className="text-sm text-brand-900/60 text-center py-10">
            {data?.length === 0
              ? 'No tienes pedidos abiertos. Presiona "Actualizar pedidos" para traer los más recientes.'
              : 'Sin resultados para tu búsqueda.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {pedidosFiltrados.map((pedido) => (
            <Card key={pedido.id_pedido_compra} className="p-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-brand-200/20">
                <span className="font-medium text-brand-900">Pedido {pedido.nro_pedido}</span>
                <span className="text-xs text-brand-900/60">Registrado {pedido.fecha_registro_bc}</span>
              </div>
              <table className="w-full text-sm">
                <thead className="text-left text-brand-900/60 border-b border-brand-900/8">
                  <tr>
                    <th className="px-4 py-2 font-medium">Código</th>
                    <th className="px-4 py-2 font-medium">Descripción</th>
                    <th className="px-4 py-2 font-medium">Cantidad</th>
                    <th className="px-4 py-2 font-medium">Recepción esperada</th>
                  </tr>
                </thead>
                <tbody>
                  {pedido.lineas.map((linea) => (
                    <tr key={linea.nro_linea} className="border-b border-brand-900/5 last:border-0">
                      <td className="px-4 py-2 text-brand-900/80">{linea.codigo_producto}</td>
                      <td className="px-4 py-2 text-brand-900/80">{linea.descripcion ?? '—'}</td>
                      <td className="px-4 py-2 text-brand-900/80">{linea.cantidad}</td>
                      <td className="px-4 py-2 text-brand-900/80">{linea.fecha_recepcion_esperada ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PedidosAbiertosPage() {
  const { esProveedor } = useAuth();

  if (!esProveedor) {
    return <ProximamentePage titulo="Pedidos Abiertos" />;
  }

  return <PedidosAbiertosProveedor />;
}