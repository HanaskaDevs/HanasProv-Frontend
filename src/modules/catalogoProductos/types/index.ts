// src/modules/catalogoProductos/types/index.ts

export type EstadoCalificacionProducto = 'Aprobado' | 'Rechazado' | 'Pendiente';

export interface ProductoCatalogo {
  id_producto: number;
  nombre_producto: string;
  codigo_barras: string | null;
  bc_nro_producto: string | null;
  // El driver de SQL Server a veces devuelve los decimales como string.
  precio: number | string | null;
  unidad_presentacion: string | null;
  bloqueado: boolean;
  estado_calificacion: EstadoCalificacionProducto;
  comentario_calificacion: string | null;
  fecha_creacion: string | null;
  id_proveedor: number;
  razon_social: string | null;
  nombre_comercial: string | null;
  ruc: string | null;
}

export interface FiltrosCatalogo {
  busqueda?: string;
  estado?: EstadoCalificacionProducto | '';
  codigo_bc?: 'con_codigo' | 'sin_codigo' | '';
  pagina?: number;
  por_pagina?: number;
}

/** Forma del paginador de Laravel, recortada a lo que usa la tabla. */
export interface RespuestaPaginada<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ResumenCatalogo {
  total: number;
  con_codigo_bc: number;
  sin_codigo_bc: number;
  pendientes_calificacion: number;
}

/** Una fila tal como sale del Excel que el usuario vuelve a subir. */
export interface FilaImportacion {
  /** Número de fila en el Excel (con encabezado), para poder señalarla en el reporte. */
  fila: number;
  id_producto: number;
  bc_nro_producto: string;
}

export interface ErrorImportacion {
  fila: number;
  id_producto: number;
  bc_nro_producto: string;
  motivo: string;
}

export interface ReporteImportacion {
  simulacion: boolean;
  total_filas: number;
  actualizados: number;
  sin_cambio: number;
  con_error: number;
  errores: ErrorImportacion[];
}