import apiClient from '../../../shared/api/apiClient';
import type { AuditoriaDetalle, ProveedorParaAuditoria, TipoAuditoria } from '../types';

export async function listarTipos(): Promise<TipoAuditoria[]> {
  const { data } = await apiClient.get<TipoAuditoria[]>('/auditorias/tipos');
  return data;
}

export async function listarProveedores(): Promise<ProveedorParaAuditoria[]> {
  const { data } = await apiClient.get<ProveedorParaAuditoria[]>('/auditorias/proveedores');
  return data;
}

export async function iniciar(idTipoAuditoria: number, idProveedor: number): Promise<AuditoriaDetalle> {
  const { data } = await apiClient.post<AuditoriaDetalle>('/auditorias/iniciar', {
    id_tipo_auditoria: idTipoAuditoria,
    id_proveedor: idProveedor,
  });
  return data;
}

export async function obtener(idAuditoria: number): Promise<AuditoriaDetalle> {
  const { data } = await apiClient.get<AuditoriaDetalle>(`/auditorias/${idAuditoria}`);
  return data;
}

export async function guardarRespuesta(
  idAuditoria: number,
  payload: { id_auditoria_pregunta: number; puntaje_obtenido: number | null; no_aplica: boolean; observacion: string | null }
): Promise<AuditoriaDetalle> {
  const { data } = await apiClient.post<AuditoriaDetalle>(`/auditorias/${idAuditoria}/respuestas`, payload);
  return data;
}

export async function finalizar(idAuditoria: number): Promise<AuditoriaDetalle> {
  const { data } = await apiClient.post<AuditoriaDetalle>(`/auditorias/${idAuditoria}/finalizar`);
  return data;
}