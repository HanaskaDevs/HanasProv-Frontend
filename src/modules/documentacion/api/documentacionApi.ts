import apiClient from '../../../shared/api/apiClient';
import type { TipoDocumentoChecklist } from '../types';

export async function obtenerChecklist(): Promise<TipoDocumentoChecklist[]> {
  const { data } = await apiClient.get<TipoDocumentoChecklist[]>('/mi-documentos');
  return data;
}

export async function subirDocumento(
  idTipoDocumento: number,
  archivo: File,
  fechaCaducidad?: string
): Promise<void> {
  const formData = new FormData();
  formData.append('archivo', archivo);
  if (fechaCaducidad) formData.append('fecha_caducidad', fechaCaducidad);

  await apiClient.post(`/mi-documentos/${idTipoDocumento}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function descargarDocumento(idDocumentoProveedor: number, nombreArchivo: string): Promise<void> {
  const { data } = await apiClient.get(`/mi-documentos/${idDocumentoProveedor}/descargar`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(data);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();
  window.URL.revokeObjectURL(url);
}