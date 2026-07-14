import apiClient from '../../../shared/api/apiClient';
import type { ChecklistDocumentacion } from '../types';

export async function obtenerChecklist(): Promise<ChecklistDocumentacion> {
  const { data } = await apiClient.get<ChecklistDocumentacion>('/mi-documentos');
  return data;
}

export async function subirDocumento(
  idTipoDocumento: number,
  archivo: File,
  fechaCaducidad?: string,
  nombreDocumento?: string
): Promise<void> {
  const formData = new FormData();
  formData.append('archivo', archivo);
  if (fechaCaducidad) formData.append('fecha_caducidad', fechaCaducidad);
  if (nombreDocumento) formData.append('nombre_documento', nombreDocumento);

  await apiClient.post(`/mi-documentos/${idTipoDocumento}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function reemplazarDocumento(
  idDocumentoProveedor: number,
  archivo: File,
  fechaCaducidad?: string,
  nombreDocumento?: string
): Promise<void> {
  const formData = new FormData();
  formData.append('archivo', archivo);
  if (fechaCaducidad) formData.append('fecha_caducidad', fechaCaducidad);
  if (nombreDocumento) formData.append('nombre_documento', nombreDocumento);

  await apiClient.post(`/mi-documentos/documento/${idDocumentoProveedor}/reemplazar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function borrarDocumento(idDocumentoProveedor: number): Promise<void> {
  await apiClient.delete(`/mi-documentos/documento/${idDocumentoProveedor}`);
}

export async function registrarDocumentacion(): Promise<void> {
  await apiClient.post('/mi-documentos/registrar');
}

export async function descargarDocumento(idDocumentoProveedor: number): Promise<void> {
  const { data } = await apiClient.get(`/mi-documentos/${idDocumentoProveedor}/descargar`, {
    responseType: 'blob',
  });
  // Vista previa en pestaña nueva (el visor de PDF nativo del navegador),
  // en vez de forzar la descarga con un <a download>. El Content-Disposition
  // que manda el backend no afecta esto -> el archivo ya lo tenemos como
  // Blob en memoria, nosotros decidimos qué hacer con él.
  const blobPdf = new Blob([data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blobPdf);
  window.open(url, '_blank');
  // Se libera un poco después para darle tiempo a la pestaña nueva a cargarlo.
  setTimeout(() => window.URL.revokeObjectURL(url), 10_000);
}