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
