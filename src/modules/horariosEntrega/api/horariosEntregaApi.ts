import apiClient from '../../../shared/api/apiClient';
import type {
  ClasificacionHorario,
  HorarioEntrega,
  HorarioHoy,
  PedidoDelDia,
  ProveedorParaHorario,
  SolicitudAprobacionArribo,
} from '../types';

export async function listar(clasificacion?: ClasificacionHorario): Promise<HorarioEntrega[]> {
  const { data } = await apiClient.get<HorarioEntrega[]>('/horarios-entrega', {
    params: clasificacion ? { clasificacion } : undefined,
  });
  return data;
}

/** Calendario propio del proveedor logueado (sección Pedidos). */
export async function misHorarios(): Promise<HorarioEntrega[]> {
  const { data } = await apiClient.get<HorarioEntrega[]>('/horarios-entrega/mios');
  return data;
}

/**
 * Seguimiento en vivo de hoy, ya con el estado calculado.
 *
 * `incluirRecibidos` lo manda SOLO el Modo TV: necesita ver la fila pasar a
 * "Recibido" para poder anunciar por voz que el proveedor entregó. Sin él
 * (Seguimiento de hoy) el backend sigue ocultando los recibidos, igual que
 * siempre -> una fila que desaparece no sirve para anunciar nada, porque
 * también desaparece al cambiar de franja horaria o al recargar.
 */
export async function listarHoy(
  clasificacion?: ClasificacionHorario,
  incluirRecibidos = false
): Promise<HorarioHoy[]> {
  const { data } = await apiClient.get<HorarioHoy[]>('/horarios-entrega/hoy', {
    params: {
      ...(clasificacion ? { clasificacion } : {}),
      ...(incluirRecibidos ? { incluir_recibidos: 1 } : {}),
    },
  });
  return data;
}

/**
 * ¿Están encendidos los anuncios por voz del Modo TV?
 *
 * Se lee de acá y no de /configuraciones porque quien tiene la TV abierta
 * suele ser el Guardia o Compras, que no tienen acceso a Configuraciones.
 * El interruptor lo cambia Sistemas desde Configuraciones -> Modo TV.
 */
export async function obtenerConfigAnuncios(): Promise<{ voz_activa: boolean }> {
  const { data } = await apiClient.get<{ voz_activa: boolean }>('/horarios-entrega/config-anuncios');
  return data;
}

/** Pedidos que ese proveedor debe entregar hoy (modal de seguimiento). */
export async function pedidosDelDia(id: number): Promise<PedidoDelDia[]> {
  const { data } = await apiClient.get<PedidoDelDia[]>(`/horarios-entrega/${id}/pedidos-del-dia`);
  return data;
}

/** El Guardia (o Sistemas/Calidad) marca que el proveedor llegó. Falla si ya está Rechazado. */
export async function marcarArribo(id: number): Promise<HorarioHoy> {
  const { data } = await apiClient.post<HorarioHoy>(`/horarios-entrega/${id}/marcar-arribo`);
  return data;
}

/** El Guardia pide aprobación de un arribo tardío (horario ya Rechazado). */
export async function solicitarAprobacion(id: number): Promise<SolicitudAprobacionArribo> {
  const { data } = await apiClient.post<SolicitudAprobacionArribo>(`/horarios-entrega/${id}/solicitar-aprobacion`);
  return data;
}

/** Calidad: solicitudes de arribo pendientes de la empresa activa. */
export async function listarSolicitudesAprobacion(): Promise<SolicitudAprobacionArribo[]> {
  const { data } = await apiClient.get<SolicitudAprobacionArribo[]>('/horarios-entrega/aprobaciones');
  return data;
}

export async function aprobarSolicitud(idSolicitud: number): Promise<SolicitudAprobacionArribo> {
  const { data } = await apiClient.post<SolicitudAprobacionArribo>(`/horarios-entrega/aprobaciones/${idSolicitud}/aprobar`);
  return data;
}

export async function rechazarSolicitud(idSolicitud: number, motivo?: string): Promise<SolicitudAprobacionArribo> {
  const { data } = await apiClient.post<SolicitudAprobacionArribo>(`/horarios-entrega/aprobaciones/${idSolicitud}/rechazar`, {
    motivo,
  });
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
