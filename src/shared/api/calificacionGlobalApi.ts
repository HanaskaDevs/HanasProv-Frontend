// src/shared/api/calificacionGlobalApi.ts
import apiClient from './apiClient';
import type { CalificacionGlobalData } from '../components/CalificacionGlobal';

/**
 * Vive en shared/ y no dentro de un módulo porque lo consumen dos módulos
 * distintos: 'calificacion' (la vista del proveedor) y 'proveedores' (la
 * vista del personal interno).
 */

export interface MiCalificacionGlobal extends CalificacionGlobalData {
  /** true = hay que mostrar el cartel de "ya es proveedor aprobado". */
  felicitacion_pendiente: boolean;
}

/** La nota del propio proveedor autenticado, en su empresa activa. */
export async function obtenerMiCalificacionGlobal(): Promise<MiCalificacionGlobal> {
  const { data } = await apiClient.get<MiCalificacionGlobal>('/mi-calificacion-global');
  return data;
}

/**
 * Apaga el cartel de felicitación para que no vuelva a salir. Es
 * idempotente: llamarlo dos veces no hace daño.
 */
export async function marcarFelicitacionVista(): Promise<void> {
  await apiClient.post('/mi-calificacion-global/felicitacion-vista');
}

export interface CalificacionGlobalProveedor extends CalificacionGlobalData {
  id_proveedor: number;
  razon_social: string | null;
  nombre_comercial: string | null;
}

/** La nota de un proveedor puntual. Solo para usuarios internos. */
export async function obtenerCalificacionGlobalDeProveedor(
  idProveedor: number
): Promise<CalificacionGlobalProveedor> {
  const { data } = await apiClient.get<CalificacionGlobalProveedor>(
    `/proveedores/${idProveedor}/calificacion-global`
  );
  return data;
}

export interface CalificacionGlobalEnLote extends CalificacionGlobalData {
  id_proveedor: number;
  razon_social: string | null;
  nombre_comercial: string | null;
  ruc: string | null;
}

/**
 * Las notas de TODOS los proveedores activos de la empresa, de una sola
 * petición. La usan la pantalla de Calificación de Proveedores y el reporte
 * comparativo: pedirlas una por una serían N peticiones y N spinners.
 */
export async function obtenerCalificacionesGlobales(): Promise<CalificacionGlobalEnLote[]> {
  const { data } = await apiClient.get<CalificacionGlobalEnLote[]>('/proveedores/calificaciones-globales');
  return data;
}
