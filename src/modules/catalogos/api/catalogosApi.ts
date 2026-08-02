// src/modules/catalogos/api/catalogosApi.ts
import apiClient from '../../../shared/api/apiClient';

export interface ClaseProveedor {
  Id_Clase_Proveedor: number;
  Nombre_Clase: string;
  Icono_Url: string | null;
  Activo: boolean;
}

export interface CategoriaProducto {
  Id_Categoria_Producto: number;
  Nombre_Categoria: string;
  Descripcion: string | null;
  Activo: boolean;
}

export interface TipoDocumento {
  Id_Tipo_Documento: number;
  Categoria: string;
  Nombre_Documento: string;
  Carpeta_Slug: string;
  Codigo_Archivo: string | null;
  Obligatorio: boolean;
  Permite_Multiples: boolean;
  Requiere_Fecha_Caducidad: boolean;
  Requiere_Solo_Quito: boolean;
  Activo: boolean;
}

export interface TipoDocumentoProducto {
  Id_Tipo_Documento_Producto: number;
  Nombre_Documento: string;
  Carpeta_Slug: string;
  Codigo_Archivo: string | null;
  Obligatorio: boolean;
  Activo: boolean;
}

export interface UnidadPresentacion {
  Id_Unidad_Presentacion: number;
  Nombre_Unidad: string;
  Activo: boolean;
}

// ---------- Clase de Proveedor ----------
export const claseProveedorApi = {
  listar: async (): Promise<ClaseProveedor[]> => (await apiClient.get('/catalogos-admin/clases-proveedor')).data,
  crear: async (payload: Record<string, unknown>): Promise<ClaseProveedor> =>
    (await apiClient.post('/catalogos-admin/clases-proveedor', payload)).data,
  actualizar: async (id: number, payload: Record<string, unknown>): Promise<ClaseProveedor> =>
    (await apiClient.put(`/catalogos-admin/clases-proveedor/${id}`, payload)).data,
  desactivar: async (id: number): Promise<{ message: string }> =>
    (await apiClient.delete(`/catalogos-admin/clases-proveedor/${id}`)).data,
  activar: async (id: number): Promise<ClaseProveedor> =>
    (await apiClient.patch(`/catalogos-admin/clases-proveedor/${id}/activar`)).data,
};

// ---------- Categoría de Producto ----------
export const categoriaProductoApi = {
  listar: async (): Promise<CategoriaProducto[]> => (await apiClient.get('/catalogos-admin/categorias-producto')).data,
  crear: async (payload: Record<string, unknown>): Promise<CategoriaProducto> =>
    (await apiClient.post('/catalogos-admin/categorias-producto', payload)).data,
  actualizar: async (id: number, payload: Record<string, unknown>): Promise<CategoriaProducto> =>
    (await apiClient.put(`/catalogos-admin/categorias-producto/${id}`, payload)).data,
  desactivar: async (id: number): Promise<{ message: string }> =>
    (await apiClient.delete(`/catalogos-admin/categorias-producto/${id}`)).data,
  activar: async (id: number): Promise<CategoriaProducto> =>
    (await apiClient.patch(`/catalogos-admin/categorias-producto/${id}/activar`)).data,
};

// ---------- Tipo de Documento (Documentación general) ----------
export const tipoDocumentoApi = {
  listar: async (): Promise<TipoDocumento[]> => (await apiClient.get('/catalogos-admin/tipos-documento')).data,
  crear: async (payload: Record<string, unknown>): Promise<TipoDocumento> =>
    (await apiClient.post('/catalogos-admin/tipos-documento', payload)).data,
  actualizar: async (id: number, payload: Record<string, unknown>): Promise<TipoDocumento> =>
    (await apiClient.put(`/catalogos-admin/tipos-documento/${id}`, payload)).data,
  desactivar: async (id: number): Promise<{ message: string }> =>
    (await apiClient.delete(`/catalogos-admin/tipos-documento/${id}`)).data,
  activar: async (id: number): Promise<TipoDocumento> =>
    (await apiClient.patch(`/catalogos-admin/tipos-documento/${id}/activar`)).data,
};

// ---------- Tipo de Documento de Producto (Ficha Productos) ----------
export const tipoDocumentoProductoApi = {
  listar: async (): Promise<TipoDocumentoProducto[]> =>
    (await apiClient.get('/catalogos-admin/tipos-documento-producto')).data,
  crear: async (payload: Record<string, unknown>): Promise<TipoDocumentoProducto> =>
    (await apiClient.post('/catalogos-admin/tipos-documento-producto', payload)).data,
  actualizar: async (id: number, payload: Record<string, unknown>): Promise<TipoDocumentoProducto> =>
    (await apiClient.put(`/catalogos-admin/tipos-documento-producto/${id}`, payload)).data,
  desactivar: async (id: number): Promise<{ message: string }> =>
    (await apiClient.delete(`/catalogos-admin/tipos-documento-producto/${id}`)).data,
  activar: async (id: number): Promise<TipoDocumentoProducto> =>
    (await apiClient.patch(`/catalogos-admin/tipos-documento-producto/${id}/activar`)).data,
};

// ---------- Unidad de Presentación ----------
export const unidadPresentacionApi = {
  listar: async (): Promise<UnidadPresentacion[]> => (await apiClient.get('/catalogos-admin/unidades-presentacion')).data,
  crear: async (payload: Record<string, unknown>): Promise<UnidadPresentacion> =>
    (await apiClient.post('/catalogos-admin/unidades-presentacion', payload)).data,
  actualizar: async (id: number, payload: Record<string, unknown>): Promise<UnidadPresentacion> =>
    (await apiClient.put(`/catalogos-admin/unidades-presentacion/${id}`, payload)).data,
  desactivar: async (id: number): Promise<{ message: string }> =>
    (await apiClient.delete(`/catalogos-admin/unidades-presentacion/${id}`)).data,
  activar: async (id: number): Promise<UnidadPresentacion> =>
    (await apiClient.patch(`/catalogos-admin/unidades-presentacion/${id}/activar`)).data,
};