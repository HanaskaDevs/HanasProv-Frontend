/**
 * Calendario de Horarios de Entrega de Proveedores. Las 3 clasificaciones
 * son fijas (así lo pidió el usuario, una por pestaña del CRUD) -> se
 * modelan como union type, no como catálogo editable.
 */
export type ClasificacionHorario = 'Perecibles' | 'No_Perecibles' | 'Fruver';

export const CLASIFICACIONES: { valor: ClasificacionHorario; etiqueta: string }[] = [
  { valor: 'Perecibles', etiqueta: 'Perecibles' },
  { valor: 'No_Perecibles', etiqueta: 'No Perecibles' },
  { valor: 'Fruver', etiqueta: 'Fruver' },
];

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'] as const;

export type DiaSemana = (typeof DIAS_SEMANA)[number];

export interface HorarioEntrega {
  id_horario_entrega_proveedor: number;
  id_proveedor: number;
  /** Código BC del proveedor (BC_Ficha_Proveedor.Nro_Proveedor), resuelto
   *  en el backend -> null si el proveedor todavía no tiene ficha en BC. */
  codigo_proveedor: string | null;
  nombre_proveedor: string | null;
  clasificacion: ClasificacionHorario;
  dia_entrega: DiaSemana;
  anden_puerta: string | null;
  /** "HH:MM" */
  hora_llegada: string;
  /** Solo aplica a Fruver (arribo -> inicio de recepción). */
  tiempo_preparacion_min: number | null;
  /** Perecibles/No Perecibles: único tramo (llegada -> salida). Fruver:
   *  tramo de recepción (inicio de recepción -> salida). */
  tiempo_permanencia_min: number | null;
  /** "HH:MM" */
  hora_salida: string | null;
}

/**
 * Seguimiento en vivo de HOY (pedido explícito: "como funcionaría un
 * aeropuerto", revisión 26-ago-2026 con aprobación de arribos tardíos).
 *
 * Programado/Atrasado/Rechazado se calculan solos en el backend
 * comparando la hora actual (Rechazado: pasaron 30 min desde la hora
 * programada sin que el Guardia marque arribo). Arribo se marca a mano
 * (Guardia) o vía una Solicitud de Aprobación resuelta por Calidad si el
 * horario ya cayó en Rechazado. En_Recepcion y Recibido YA NO se marcan a
 * mano: los pone en automático el job que lee SIGH. Una vez Recibido, la
 * fila deja de aparecer en /horarios-entrega/hoy.
 */
export type EstadoHorario = 'Programado' | 'Atrasado' | 'Rechazado' | 'Arribo' | 'En_Recepcion' | 'Recibido';

export const ESTADOS_HORARIO: Record<EstadoHorario, { etiqueta: string }> = {
  Programado: { etiqueta: 'Programado' },
  Atrasado: { etiqueta: 'Atrasado' },
  Rechazado: { etiqueta: 'Rechazado' },
  Arribo: { etiqueta: 'Arribo' },
  En_Recepcion: { etiqueta: 'En recepción' },
  Recibido: { etiqueta: 'Recibido' },
};

export interface HorarioHoy extends HorarioEntrega {
  estado: EstadoHorario;
  /** "HH:MM" real en que se registró el arribo (Guardia o aprobación de Calidad), null si aún no. */
  hora_arribo_real: string | null;
  /** "HH:MM" real en que SIGH confirmó el ingreso a recepción, null si aún no. */
  hora_recepcion_real: string | null;
  /** Nro_Pedido de SIGH (NroDocumentoBC) con el que se hizo el match automático, null hasta En_Recepcion. */
  nro_documento_bc: string | null;
  /** "HH:MM" real en que SIGH confirmó EstadoPedido = 'N' (Recibido), null si aún no. */
  hora_recibido_real: string | null;
  /** true si ya hay una Solicitud_Aprobacion_Arribo Pendiente para hoy (Rechazado esperando a Calidad). */
  tiene_solicitud_pendiente: boolean;
}

/** Bandeja de Calidad: solicitudes de arribo tardío pendientes de aprobar/rechazar. */
export interface SolicitudAprobacionArribo {
  id_solicitud_aprobacion_arribo: number;
  id_horario_entrega_proveedor: number;
  nombre_proveedor: string | null;
  hora_llegada: string;
  fecha: string;
  solicitado_por: string | null;
  fecha_solicitud: string;
}

/** Pedido que el proveedor debe entregar hoy (modal de seguimiento para Admin/Compras/Calidad). */
export interface PedidoDelDia {
  id_pedido_compra: number;
  nro_pedido: string;
  estado: string;
  estado_pedido_bc: string | null;
  fecha_recepcion_esperada: string | null;
}

export interface ProveedorParaHorario {
  id_proveedor: number;
  nombre: string;
  codigo_bc: string | null;
}

export interface DatosHorarioForm {
  id_proveedor: number | '';
  clasificacion: ClasificacionHorario;
  dia_entrega: DiaSemana | '';
  anden_puerta: string;
  hora_llegada: string;
  tiempo_preparacion_min: string;
  tiempo_permanencia_min: string;
  hora_salida: string;
}
