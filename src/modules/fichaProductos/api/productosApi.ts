import apiClient from '../../../shared/api/apiClient';
import type { NuevoProducto, Producto, ResumenRegistro, UnidadPresentacion } from '../types';

export async function listarProductos(): Promise<Producto[]> {
  const { data } = await apiClient.get<Producto[]>('/mis-productos');
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

export async function verDocumentoProducto(idDocumentoProducto: number): Promise<void> {
  const { data } = await apiClient.get(`/mis-productos/documentos/${idDocumentoProducto}/ver`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(data);
  window.open(url, '_blank');
}

export async function obtenerResumenRegistro(): Promise<ResumenRegistro> {
  const { data } = await apiClient.get<ResumenRegistro>('/mis-productos/resumen-registro');
  return data;
}

export async function registrarProductos(): Promise<{ message: string; total: number }> {
  const { data } = await apiClient.post('/mis-productos/registrar');
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