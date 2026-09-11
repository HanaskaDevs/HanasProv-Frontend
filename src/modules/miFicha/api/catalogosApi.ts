import apiClient from '../../../shared/api/apiClient';

export interface ClaseProveedorCatalogo {
  id_clase_proveedor: number;
  nombre_clase: string;
}

export interface CategoriaProductoCatalogo {
  id_categoria_producto: number;
  nombre_categoria: string;
  descripcion: string | null;
}

export async function listarClasesProveedor(): Promise<ClaseProveedorCatalogo[]> {
  const { data } = await apiClient.get<ClaseProveedorCatalogo[]>('/catalogos/clases-proveedor');
  return data;
}

export async function listarCategoriasProducto(): Promise<CategoriaProductoCatalogo[]> {
  const { data } = await apiClient.get<CategoriaProductoCatalogo[]>('/catalogos/categorias-producto');
  return data;
}

export interface GrupoImpuestoCatalogo {
  /** Lo que se guarda y viaja a BC (ej. "PERSONA NATURAL"). */
  codigo: string;
  /** Lo que ve el proveedor (ej. "Persona Natural"). */
  descripcion: string;
}

/** Clase de contribuyente de la Sección 1 = Grupo de impuesto de BC. */
export async function listarGruposImpuesto(): Promise<GrupoImpuestoCatalogo[]> {
  const { data } = await apiClient.get<GrupoImpuestoCatalogo[]>('/catalogos/grupos-impuesto');
  return data;
}

export interface BancoCatalogo {
  id_banco: number;
  nombre_banco: string;
}

/**
 * Bancos para el selector de la cuenta bancaria. El backend NO devuelve
 * el código de sucursal de BC a propósito: ese se resuelve del catálogo
 * al postear, el proveedor solo elige por nombre.
 */
export async function listarBancos(): Promise<BancoCatalogo[]> {
  const { data } = await apiClient.get<BancoCatalogo[]>('/catalogos/bancos');
  return data;
}
