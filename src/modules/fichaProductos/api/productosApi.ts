import apiClient from '../../../shared/api/apiClient';
import type { NuevoProducto, Producto, ResumenRegistro, SolicitudCambioPrecio, UnidadPresentacion } from '../types';

export interface RespuestaPaginada<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/**
 * Paginado y búsqueda del lado del servidor -> con catálogos de 1000+
 * productos, traer todo de una vez y filtrar/paginar en el navegador
 * sería impracticable (payload gigante + el browser renderizando miles
 * de filas). Acá nunca se pide más de una página a la vez.
 */
export type EstadoFiltroProducto = 'aprobado' | 'rechazado' | 'en_revision' | 'pendiente';

export async function listarProductos(
  pagina: number,
  busqueda: string,
  estados: EstadoFiltroProducto[] = []
): Promise<RespuestaPaginada<Producto>> {
  const { data } = await apiClient.get<RespuestaPaginada<Producto>>('/mis-productos', {
    params: {
      page: pagina,
      per_page: 20,
      search: busqueda || undefined,
      // Varios estados a la vez (filtro tipo BC) -> se mandan
      // coma-separados, el backend hace un whereIn en vez de un where.
      estado: estados.length > 0 ? estados.join(',') : undefined,
    },
  });
  return data;
}

export async function crearProducto(payload: NuevoProducto): Promise<Producto> {
  const { data } = await apiClient.post<Producto>('/mis-productos', payload);
  return data;
}

export async function subirDocumentoProducto(
  idProducto: number,
  idTipoDocumento: number,
  archivo: File
): Promise<void> {
  const formData = new FormData();
  formData.append('archivo', archivo);

  await apiClient.post(`/mis-productos/${idProducto}/documentos/${idTipoDocumento}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function listarUnidadesPresentacion(): Promise<UnidadPresentacion[]> {
  const { data } = await apiClient.get<UnidadPresentacion[]>('/mis-productos/unidades-presentacion');
  return data;
}

export async function obtenerUrlVisorDocumentoProducto(idDocumentoProducto: number): Promise<string> {
  const { data } = await apiClient.get(`/mis-productos/documentos/${idDocumentoProducto}/ver`, {
    responseType: 'blob',
  });
  return window.URL.createObjectURL(data);
}

export async function obtenerResumenRegistro(idsProductos?: number[]): Promise<ResumenRegistro> {
  const { data } = await apiClient.get<ResumenRegistro>('/mis-productos/resumen-registro', {
    params: idsProductos && idsProductos.length > 0 ? { ids: idsProductos.join(',') } : undefined,
  });
  return data;
}

export async function registrarProductos(idsProductos: number[]): Promise<{ message: string; total: number }> {
  const { data } = await apiClient.post('/mis-productos/registrar', { ids: idsProductos });
  return data;
}
export async function eliminarProducto(idProducto: number): Promise<{ message: string }> {
  const { data } = await apiClient.delete(`/mis-productos/${idProducto}`);
  return data;
}

export async function eliminarProductosMasivo(ids: number[]): Promise<{ message: string; total: number }> {
  const { data } = await apiClient.delete('/mis-productos/masivo', { data: { ids } });
  return data;
}

export async function eliminarDocumentoProducto(idDocumentoProducto: number): Promise<{ message: string }> {
  const { data } = await apiClient.delete(`/mis-productos/documentos/${idDocumentoProducto}`);
  return data;
}

export async function confirmarCorreccionProducto(idProducto: number): Promise<void> {
  await apiClient.post(`/mis-productos/${idProducto}/confirmar-correccion`);
}

/**
 * Pide cambiar el precio de un producto ya creado (solo si el proveedor
 * está Aprobado -> lo valida el backend). Bloquea el precio hasta que
 * Admin/Calidad de la empresa lo apruebe o lo rechace.
 */
export async function solicitarCambioPrecio(idProducto: number, precioNuevo: number): Promise<SolicitudCambioPrecio> {
  const { data } = await apiClient.patch<SolicitudCambioPrecio>(`/mis-productos/${idProducto}/precio`, {
    precio_nuevo: precioNuevo,
  });
  return data;
}

export async function listarCambiosPrecioPendientes(): Promise<SolicitudCambioPrecio[]> {
  const { data } = await apiClient.get<SolicitudCambioPrecio[]>('/cambios-precio');
  return data;
}

export async function aprobarCambioPrecio(idSolicitud: number): Promise<SolicitudCambioPrecio> {
  const { data } = await apiClient.post<SolicitudCambioPrecio>(`/cambios-precio/${idSolicitud}/aprobar`);
  return data;
}

export async function rechazarCambioPrecio(idSolicitud: number, motivo?: string): Promise<SolicitudCambioPrecio> {
  const { data } = await apiClient.post<SolicitudCambioPrecio>(`/cambios-precio/${idSolicitud}/rechazar`, { motivo });
  return data;
}