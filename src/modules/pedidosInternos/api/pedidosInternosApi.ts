import apiClient from '../../../shared/api/apiClient';
import type { FiltrosPedidosInternos, PedidosPorBodega } from '../types';

export async function listarPedidosPorBodega(filtros: FiltrosPedidosInternos): Promise<PedidosPorBodega> {
  const { data } = await apiClient.get<PedidosPorBodega>('/pedidos/internos', {
    params: {
      fecha_desde: filtros.fecha_desde || undefined,
      fecha_hasta: filtros.fecha_hasta || undefined,
      proveedor: filtros.proveedor || undefined,
      producto: filtros.producto || undefined,
    },
  });
  return data;
}