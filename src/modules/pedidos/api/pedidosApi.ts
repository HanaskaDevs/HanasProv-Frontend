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