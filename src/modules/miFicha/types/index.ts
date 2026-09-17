// src/modules/miFicha/types/index.ts
export interface Seccion1Data {
  ruc: string | null;
  clase_contribuyente: string | null;
  razon_social: string | null;
  nombre_comercial: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  pagina_web: string | null;
  latitud: number | string | null;
  longitud: number | string | null;
  representante_legal: string | null;
  correo_representante: string | null;
  telefono_representante: string | null;
  contacto_venta: string | null;
  correo_venta: string | null;
  telefono_contacto_venta: string | null;
  contacto_calidad: string | null;
  correo_calidad: string | null;
  telefono_contacto_calidad: string | null;
  contacto_contabilidad: string | null;
  correo_contabilidad: string | null;
  telefono_contabilidad: string | null;
}

export interface ClaseSeleccionada {
  id_clase_proveedor: number;
  nombre_clase: string;
}

export interface CategoriaSeleccionada {
  id_categoria_producto: number;
  nombre_categoria: string;
}

export interface FichaProveedor {
  /**
   * Lo calcula el BACKEND (FichaProveedorService::seccion1EstaCompleta), no
   * la pantalla: son 22 campos obligatorios y tenerlos listados en los dos
   * lados terminó en que la ficha aparecía completa estando vacía.
   */
  seccion_1_completa: boolean;
  /**
   * Fecha ('YYYY-MM-DD') en que el proveedor aceptó las Políticas de
   * Hanaska al enviar su ficha a revisión; null si todavía no la envió.
   * Mientras sea null, el guardado que complete la ficha exige la casilla
   * de aceptación (ver AceptacionPoliticas y FichaProveedorService).
   */
  fecha_aceptacion_politicas: string | null;
  id_proveedor: number;
  seccion_actual: number | string;
  porcentaje_completado: number | string;
  estado: string | null;
  calificaciones_campos: Record<
    string,
    { estado: 'Aprobado' | 'Rechazado' | null; observacion: string | null; fecha: string | null }
  >;
  estado_calificacion_general: 'Aprobado' | 'Rechazado' | null;
  seccion_1: Seccion1Data;
  seccion_2: { clases: ClaseSeleccionada[] };
  seccion_3: { categorias: CategoriaSeleccionada[] };
}
/** AHO = ahorros, CTE = corriente. Mismos códigos que usa Business Central. */
export type TipoCuentaBancaria = 'AHO' | 'CTE';

/**
 * Cuenta donde se le paga al proveedor. El código de sucursal que
 * necesita BC NO viaja al front a propósito: es interno de la
 * integración, el proveedor solo ve/elige el nombre del banco.
 */
export interface CuentaBancaria {
  id_banco: number;
  nombre_banco: string | null;
  tipo_cuenta: TipoCuentaBancaria;
  nro_cuenta: string;
  fecha_modificacion: string | null;
}

export interface GuardarCuentaBancariaPayload {
  id_banco: number;
  tipo_cuenta: TipoCuentaBancaria;
  nro_cuenta: string;
}
