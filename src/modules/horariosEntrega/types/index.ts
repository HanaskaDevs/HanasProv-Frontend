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
 * aeropuerto"). Programado/Atrasado/En_Recepcion se calculan solos en el
 * backend comparando la hora actual; En_Arribo y Entregado son los 2
 * eventos que se marcan a mano (Guardia y Compras respectivamente). Una
 * vez Entregado, la fila deja de aparecer en /horarios-entrega/hoy.
 */
export type EstadoHorario = 'Programado' | 'Atrasado' | 'En_Arribo' | 'En_Recepcion' | 'Entregado';

export const ESTADOS_HORARIO: Record<EstadoHorario, { etiqueta: string }> = {
  Programado: { etiqueta: 'Programado' },
  Atrasado: { etiqueta: 'Atrasado' },
  En_Arribo: { etiqueta: 'En arribo' },
  En_Recepcion: { etiqueta: 'En recepción' },
  Entregado: { etiqueta: 'Entregado' },
};

export interface HorarioHoy extends HorarioEntrega {
  estado: EstadoHorario;
  /** "HH:MM" real en que el Guardia marcó el arribo, null si aún no. */
  hora_arribo_real: string | null;
  /** "HH:MM" real en que Compras marcó la entrega, null si aún no. */
  hora_entregado_real: string | null;
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
