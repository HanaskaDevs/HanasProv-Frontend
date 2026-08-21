import apiClient from '../../../shared/api/apiClient';
import type { ClasificacionHorario, HorarioEntrega, HorarioHoy, ProveedorParaHorario } from '../types';

export async function listar(clasificacion?: ClasificacionHorario): Promise<HorarioEntrega[]> {
  const { data } = await apiClient.get<HorarioEntrega[]>('/horarios-entrega', {
    params: clasificacion ? { clasificacion } : undefined,
  });
  return data;
}

/** Seguimiento en vivo de hoy: ya viene con el estado calculado y sin los "Entregado". */
export async function listarHoy(clasificacion?: ClasificacionHorario): Promise<HorarioHoy[]> {
  const { data } = await apiClient.get<HorarioHoy[]>('/horarios-entrega/hoy', {
    params: clasificacion ? { clasificacion } : undefined,
  });
  return data;
}

/** El Guardia marca que el proveedor llegó. */
export async function marcarArribo(id: number): Promise<HorarioHoy> {
  const { data } = await apiClient.post<HorarioHoy>(`/horarios-entrega/${id}/marcar-arribo`);
  return data;
}

/** Compras marca la entrega como completada. */
export async function marcarEntregado(id: number): Promise<HorarioHoy> {
  const { data } = await apiClient.post<HorarioHoy>(`/horarios-entrega/${id}/marcar-entregado`);
  return data;
}

export async function listarProveedores(): Promise<ProveedorParaHorario[]> {
  const { data } = await apiClient.get<ProveedorParaHorario[]>('/horarios-entrega/proveedores');
  return data;
}

export interface PayloadHorario {
  id_proveedor: number;
  clasificacion: ClasificacionHorario;
  dia_entrega: string;
  anden_puerta: string | null;
  hora_llegada: string;
  tiempo_preparacion_min: number | null;
  tiempo_permanencia_min: number | null;
  hora_salida: string | null;
}

export async function crear(payload: PayloadHorario): Promise<HorarioEntrega> {
  const { data } = await apiClient.post<HorarioEntrega>('/horarios-entrega', payload);
  return data;
}

export async function actualizar(id: number, payload: PayloadHorario): Promise<HorarioEntrega> {
  const { data } = await apiClient.put<HorarioEntrega>(`/horarios-entrega/${id}`, payload);
  return data;
}

export async function eliminar(id: number): Promise<{ message: string }> {
  const { data } = await apiClient.delete<{ message: string }>(`/horarios-entrega/${id}`);
  return data;
}
