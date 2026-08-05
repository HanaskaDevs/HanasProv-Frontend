import apiClient from '../../../shared/api/apiClient';

export interface PedidoProximo {
  nro_pedido: string;
  proveedor: string | null;
  fecha_recepcion_esperada: string | null;
  vencido: boolean;
}

export interface ResumenDashboardSistemas {
  total_empresas: number;
  proveedores_por_estado: Record<string, number>;
  fichas_pendientes: number;
  documentos_pendientes: number;
  productos_pendientes: number;
  reclamos_abiertos: number;
  pedidos_proximos: PedidoProximo[];
}

export async function obtenerResumenDashboard(): Promise<ResumenDashboardSistemas> {
  const { data } = await apiClient.get<ResumenDashboardSistemas>('/dashboard/sistemas');
  return data;
}