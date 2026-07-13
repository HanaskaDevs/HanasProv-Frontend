import apiClient from '../../../shared/api/apiClient';
import type { PedidoCompra } from '../types';

export async function listarPedidosAbiertos(): Promise<PedidoCompra[]> {
  const { data } = await apiClient.get<PedidoCompra[]>('/pedidos/abiertos');
  return data;
}

export async function listarPedidosCerrados(): Promise<PedidoCompra[]> {
  const { data } = await apiClient.get<PedidoCompra[]>('/pedidos/cerrados');
  return data;
}

export async function actualizarPedidos(): Promise<{ message: string; total: number }> {
  const { data } = await apiClient.post('/pedidos/actualizar');
  return data;
}

export async function descargarPedidosPdf(ids: number[]): Promise<void> {
  const { data } = await apiClient.post(
    '/pedidos/descargar-pdf',
    { ids },
    { responseType: 'blob' }
  );
  const url = window.URL.createObjectURL(data);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = ids.length === 1 ? `pedido-${ids[0]}.pdf` : 'pedidos.pdf';
  enlace.click();
  window.URL.revokeObjectURL(url);
}