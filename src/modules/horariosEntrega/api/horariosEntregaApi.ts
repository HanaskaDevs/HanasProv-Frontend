import apiClient from '../../../shared/api/apiClient';
import type {
  ClasificacionHorario,
  HorarioEntrega,
  HorarioHoy,
  HorarioPropio,
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

/** Calendario propio del proveedor logueado (sección Pedidos), con los pedidos de cada día. */
export async function misHorarios(): Promise<HorarioPropio[]> {
  const { data } = await apiClient.get<HorarioPropio[]>('/horarios-entrega/mios');
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

// ---------------------------------------------------------------------------
// Carga masiva desde Excel (Sistemas y Admin)
// ---------------------------------------------------------------------------

export type IdentificadorCarga = 'codigo_bc' | 'ruc';

/** Una fila tal como se leyó del Excel (ver utils/excelCargaHorarios). */
export interface FilaCargaHorario {
  numero_fila: number;
  clasificacion: string;
  dia_entrega: string;
  identificador: string;
  anden_puerta: string;
  hora_llegada: string;
  tiempo_permanencia: string;
  tiempo_preparacion: string;
  hora_salida: string;
}

export interface ResultadoFilaCargaHorario {
  numero_fila: number;
  estado: 'crear' | 'actualizar' | 'error';
  mensaje: string | null;
  identificador: string | null;
  clasificacion: string | null;
  dia_entrega: string | null;
  nombre_proveedor: string | null;
  hora_llegada?: string;
  hora_salida?: string | null;
}

export interface ReporteCargaHorarios {
  aplicado: boolean;
  identificador: IdentificadorCarga;
  clasificaciones: string[];
  resumen: { total: number; crear: number; actualizar: number; errores: number; dar_de_baja: number };
  filas: ResultadoFilaCargaHorario[];
  bajas: { nombre_proveedor: string | null; clasificacion: string; dia_entrega: string; hora_llegada: string }[];
}

/**
 * confirmar = false: vista previa, no escribe nada. true: aplica. El archivo
 * REEMPLAZA el calendario de las clasificaciones que trae (ver
 * CargaMasivaHorariosService en el backend).
 */
export async function cargaMasiva(
  identificador: IdentificadorCarga,
  filas: FilaCargaHorario[],
  confirmar: boolean
): Promise<ReporteCargaHorarios> {
  const { data } = await apiClient.post<ReporteCargaHorarios>('/horarios-entrega/carga-masiva', {
    identificador,
    filas,
    confirmar,
  });
  return data;
}
