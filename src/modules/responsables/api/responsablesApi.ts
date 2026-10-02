import apiClient from '../../../shared/api/apiClient';
import type {
  AsignacionResponsable,
  FilaAsignacion,
  MiResponsable,
  ReporteImportacion,
  Responsable,
} from '../types';

// ---- Lo que consulta el proveedor ----

export async function obtenerMiResponsable(): Promise<MiResponsable | null> {
  const { data } = await apiClient.get<{ responsable: MiResponsable | null }>('/mi-responsable');
  return data.responsable;
}

// ---- Administración (Sistemas) ----

export async function listarResponsables(): Promise<Responsable[]> {
  const { data } = await apiClient.get<Responsable[]>('/responsables');
  return data;
}

export async function crearResponsable(payload: {
  nombre: string;
  correo: string;
  telefono?: string | null;
}): Promise<Responsable> {
  const { data } = await apiClient.post<Responsable>('/responsables', payload);
  return data;
}

export async function actualizarResponsable(
  id: number,
  payload: { nombre: string; correo: string; telefono?: string | null; activo?: boolean }
): Promise<Responsable> {
  const { data } = await apiClient.put<Responsable>(`/responsables/${id}`, payload);
  return data;
}

export async function eliminarResponsable(id: number): Promise<{ message: string }> {
  const { data } = await apiClient.delete(`/responsables/${id}`);
  return data;
}

export async function listarAsignaciones(): Promise<AsignacionResponsable[]> {
  const { data } = await apiClient.get<AsignacionResponsable[]>('/responsables/asignaciones');
  return data;
}

export async function eliminarAsignacion(id: number): Promise<{ message: string }> {
  const { data } = await apiClient.delete(`/responsables/asignaciones/${id}`);
  return data;
}

/** Paso 1: el reporte, sin guardar nada. */
export async function validarImportacion(filas: FilaAsignacion[]): Promise<ReporteImportacion> {
  const { data } = await apiClient.post<ReporteImportacion>('/responsables/importar/validar', { filas });
  return data;
}

/** Paso 2: aplicar. */
export async function importarAsignaciones(filas: FilaAsignacion[]): Promise<ReporteImportacion> {
  const { data } = await apiClient.post<ReporteImportacion>('/responsables/importar', { filas });
  return data;
}
