import apiClient from '../../../shared/api/apiClient';

const BASE = '/reportes/historial-proveedores';

/** Una entrega del historial: un proveedor, un día. */
export interface EntregaHistorial {
  id_horario_entrega_estado_diario: number;
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
  /** Informativos: los escribe el sincronizador de SIGH con su propia hora. */
  hora_recepcion: string | null;
  hora_entregado: string | null;
  nro_documento_bc: string | null;
  estado_final: 'Recibido' | 'En_Recepcion' | 'Arribo' | 'Sin_Arribo';
}

export interface ResumenProveedor {
  id_proveedor: number;
  proveedor: string | null;
  ruc: string | null;
  entregas: number;
  sin_arribo_marcado: number;
  a_tiempo: number;
  tarde: number;
  atraso_promedio: number | null;
  atraso_maximo: number | null;
  recibidas: number;
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
