import apiClient from '../../../shared/api/apiClient';

export interface ResumenDashboardSistemas {
  total_empresas: number;
  proveedores_por_estado: Record<string, number>;
  fichas_pendientes: number;
  documentos_pendientes: number;
  productos_pendientes: number;
  reclamos_abiertos: number;
}

export async function obtenerResumenDashboard(): Promise<ResumenDashboardSistemas> {
  const { data } = await apiClient.get<ResumenDashboardSistemas>('/dashboard/sistemas');
  return data;
}