import apiClient from '../../../shared/api/apiClient';

const BASE = '/reportes/historial-proveedores';

/** Una entrega del historial: un proveedor, un día. */
export interface EntregaHistorial {
  /** Clave única de la fila (las rechazadas no tienen id de estado diario). */
  clave: string;
  id_horario_entrega_estado_diario: number | null;
  fecha: string | null;
  id_proveedor: number | null;
  proveedor: string | null;
  ruc: string | null;
  clasificacion: string | null;
  anden_puerta: string | null;
  hora_programada: string | null;
  hora_arribo: string | null;
  /** Positivo = llegó tarde, negativo = antes, null = sin arribo marcado. */
  minutos_atraso: number | null;
  /** Salida PROGRAMADA del calendario. El portal no registra la salida real. */
  hora_salida: string | null;
  /**
   * Hora real del ingreso a bodega en SIGH (desde el 12-nov). En SIGH el
   * ingreso y el cierre del pedido son el mismo acto, así que
   * hora_entregado coincide con esta.
   */
  hora_recepcion: string | null;
  hora_entregado: string | null;
  /** Minutos desde que llegó hasta que lo recibieron. Negativo = el arribo se marcó tarde. */
  minutos_espera: number | null;
  nro_documento_bc: string | null;
  /**
   * Rechazado_No_Llego / Rechazado_Atrasado desde el 25-nov-2026: las citas
   * rechazadas, que antes no salían (ver HistorialEntregasService).
   */
  estado_final: 'Recibido' | 'En_Recepcion' | 'Arribo' | 'Sin_Arribo' | 'Rechazado_No_Llego' | 'Rechazado_Atrasado';
  /**
   * Solo en Rechazado_Atrasado: en qué quedó la solicitud de arribo tardío.
   * Sin_Solicitud = el Guardia no la pidió, pero su pedido se recibió en
   * bodega (llegó pasada la tolerancia; caso Finca Los Nonnos, 24-nov).
   */
  aprobacion: 'Pendiente' | 'Rechazada' | 'Sin_Solicitud' | null;
}

export interface ResumenProveedor {
  id_proveedor: number;
  proveedor: string | null;
  ruc: string | null;
  /** Todas sus citas del rango, también las rechazadas. */
  entregas: number;
  sin_arribo_marcado: number;
  /** Rechazados que no llegaron. */
  rechazados_no_llego: number;
  /** Rechazados que llegaron atrasados (aprobación pendiente o rechazada). */
  rechazados_atrasado: number;
  a_tiempo: number;
  tarde: number;
  atraso_promedio: number | null;
  atraso_maximo: number | null;
  recibidas: number;
  /** Promedio de minutos entre la llegada y la recepción (solo esperas >= 0). */
  espera_promedio: number | null;
}

export interface HistorialProveedores {
  desde: string;
  hasta: string;
  /** Tope de días que admite el backend (3 meses). */
  max_dias: number;
  entregas: EntregaHistorial[];
  por_proveedor: ResumenProveedor[];
}

export interface FiltrosHistorial {
  desde?: string;
  hasta?: string;
  id_proveedor?: number;
  clasificacion?: string;
}

export async function consultar(filtros: FiltrosHistorial = {}): Promise<HistorialProveedores> {
  const { data } = await apiClient.get<HistorialProveedores>(BASE, { params: filtros });
  return data;
}
