import apiClient from '../../../shared/api/apiClient';
import type { FiltrosPedidosInternos, PedidosPorBodega } from '../types';

export async function listarPedidosPorBodega(filtros: FiltrosPedidosInternos): Promise<PedidosPorBodega> {
  const { data } = await apiClient.get<PedidosPorBodega>('/pedidos/internos', {
    params: {
      fecha_recepcion_esperada: filtros.fecha_recepcion_esperada || undefined,
      proveedor: filtros.proveedor || undefined,
      producto: filtros.producto || undefined,
    },
  });
  return data;
}