import apiClient from '../../../shared/api/apiClient';
import type { RespuestaPaginada } from '../../fichaProductos/api/productosApi';

export interface ProductoConProveedor {
  id_producto: number;
  nombre_producto: string;
  codigo_barras: string | null;
  unidad_presentacion: string | null;
  precio: number | null;
  estado_calificacion: string | null;
  codigo_bc: string | null;
  proveedor: {
    id_proveedor: number;
    razon_social: string;
    nombre_comercial: string | null;
  } | null;
}

export async function listarProductosProveedores(
  pagina: number,
  busqueda: string
): Promise<RespuestaPaginada<ProductoConProveedor>> {
  const { data } = await apiClient.get<RespuestaPaginada<ProductoConProveedor>>('/productos-proveedores', {
    params: {
      page: pagina,
      per_page: 20,
      search: busqueda || undefined,
    },
  });
  return data;
}

export async function guardarCodigoBC(idProducto: number, codigoBC: string): Promise<ProductoConProveedor> {
  const { data } = await apiClient.put<ProductoConProveedor>(`/productos-proveedores/${idProducto}/codigo-bc`, {
    codigo_bc: codigoBC || null,
  });
  return data;
}

export interface ResultadoImportacionCodigoBC {
  actualizados: number;
  no_encontrados: string[];
}

export async function importarCodigosBC(archivo: File): Promise<ResultadoImportacionCodigoBC> {
  const formData = new FormData();
  formData.append('archivo', archivo);
  const { data } = await apiClient.post<ResultadoImportacionCodigoBC>('/productos-proveedores/importar-codigo-bc', formData);
  return data;
}