// src/modules/revisionCompras/types.ts

/**
 * Excel de los productos que esperan a Catálogo en "Productos por revisar"
 * (18-nov-2026). Ver RevisionCatalogoExcelService en el backend, que es
 * quien interpreta y valida cada celda.
 */

/**
 * Columnas que Catálogo puede modificar en el archivo. Son las mismas claves
 * que espera el backend (RevisionCatalogoExcelService::CAMPOS).
 */
export const CAMPOS_EDITABLES = [
  'nombre_producto',
  'codigo_barras',
  'categoria',
  'unidad',
  'precio',
  'peso',
  'unidad_por_caja',
  'contenido_paquete',
  'masterpack_largo_cm',
  'masterpack_ancho_cm',
  'masterpack_alto_cm',
  'unidad_largo_cm',
  'unidad_ancho_cm',
  'unidad_alto_cm',
  'grupos',
] as const;

export type CampoEditable = (typeof CAMPOS_EDITABLES)[number];

/** Una fila tal como la devuelve el backend para armar el Excel: todo texto. */
export type FilaExcelRevision = {
  id_producto: number;
  /** De referencia: no se modifican desde el archivo. */
  proveedor: string;
  ruc: string;
  bc_nro_producto: string;
} & Record<CampoEditable, string>;

/** Lo que se puede escribir en las columnas de lista (hoja de ayuda del archivo). */
export interface ValoresValidosRevision {
  categorias: string[];
  unidades: string[];
  grupos: { codigo: string; nombre: string }[];
}

export interface ExportacionRevisionCatalogo {
  filas: FilaExcelRevision[];
  valores_validos: ValoresValidosRevision;
}

/**
 * Una fila del archivo que el usuario vuelve a subir. Solo trae las columnas
 * que estaban en el archivo: la que falta no se manda, y el backend entiende
 * "no tocar ese dato".
 */
export type FilaImportacionRevision = {
  /** Número de fila en el Excel, para señalarla en el reporte. */
  fila: number;
  id_producto: number;
} & Partial<Record<CampoEditable, string>>;

export interface CambioDeCampo {
  campo: string;
  antes: string;
  despues: string;
}

export interface ProductoConCambios {
  fila: number;
  id_producto: number;
  producto: string;
  proveedor: string;
  cambios: CambioDeCampo[];
}

export interface ErrorImportacionRevision {
  fila: number;
  id_producto: number;
  producto: string;
  motivo: string;
}

export interface ReporteImportacionRevision {
  simulacion: boolean;
  total_filas: number;
  actualizados: number;
  sin_cambio: number;
  con_error: number;
  errores: ErrorImportacionRevision[];
  cambios: ProductoConCambios[];
}
