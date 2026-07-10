export interface UnidadPresentacion {
  Id_Unidad_Presentacion: number;
  Nombre_Unidad: string;
}

export interface DocumentoProducto {
  id_documento_producto: number;
  tipo: string;
  nombre_original: string;
}

export interface Producto {
  id_producto: number;
  nombre_producto: string;
  codigo_barras: string | null;
  unidad_presentacion: string;
  precio: string | null;
  documentos: DocumentoProducto[];
}

export interface NuevoProducto {
  nombre_producto: string;
  codigo_barras?: string;
  id_unidad_presentacion: number;
  precio?: number;
}