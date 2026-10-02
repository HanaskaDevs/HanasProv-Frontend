export interface Responsable {
  Id_Responsable: number;
  Nombre: string;
  Correo: string;
  Telefono: string | null;
  Activo: boolean;
  /** Cuántos proveedores tiene asignados. Lo calcula el backend. */
  asignaciones_count?: number;
}

export interface AsignacionResponsable {
  id_responsable_proveedor: number;
  nro_proveedor_bc: string;
  /** Razón social según BC, para que se reconozca de quién se habla. */
  nombre_en_bc: string | null;
  responsable: {
    id_responsable: number | null;
    nombre: string | null;
    correo: string | null;
    telefono: string | null;
    activo: boolean;
  };
}

/** Una fila del archivo, ya reducida a lo que entiende el backend. */
export interface FilaAsignacion {
  fila: number;
  codigo_bc: string;
  correo: string;
}

export interface ErrorImportacion {
  fila: number;
  codigo_bc: string;
  correo: string;
  motivo: string;
}

export interface ReporteImportacion {
  total_filas: number;
  nuevas: number;
  cambios: number;
  sin_cambio: number;
  errores: ErrorImportacion[];
  aplicado: boolean;
}

/** Lo que ve el proveedor: su contacto en Hanaska. */
export interface MiResponsable {
  nombre: string;
  correo: string;
  telefono: string | null;
  nro_proveedor_bc: string;
}
