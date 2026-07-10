import apiClient from '../../../shared/api/apiClient';
import type { NuevoProducto, Producto, UnidadPresentacion } from '../types';

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