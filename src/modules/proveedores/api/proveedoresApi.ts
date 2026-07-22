// src/modules/proveedores/api/proveedoresApi.ts
import apiClient from '../../../shared/api/apiClient';
import type { FichaProveedor } from '../../miFicha/types';
import type { ChecklistCalificacion, PayloadCalificar, ProveedorListado } from '../types';

export async function listarProveedores(): Promise<ProveedorListado[]> {
  const { data } = await apiClient.get<ProveedorListado[]>('/proveedores');
  return data;
}

export async function obtenerFichaCalificacion(idProveedor: number): Promise<FichaProveedor> {
  const { data } = await apiClient.get<FichaProveedor>(`/proveedores/${idProveedor}/ficha-calificacion`);
  return data;
}

export interface CampoRechazado {
  campo: string;
  observacion: string;
}

export interface PayloadCalificarFichaGeneral {
  aprobado: boolean;
  campos_rechazados?: CampoRechazado[];
}

export async function calificarFichaGeneral(
  idProveedor: number,
  payload: PayloadCalificarFichaGeneral
): Promise<FichaProveedor> {
  const { data } = await apiClient.post<FichaProveedor>(`/proveedores/${idProveedor}/ficha-calificacion`, payload);
  return data;
}

export async function obtenerDocumentosCalificacion(idProveedor: number): Promise<ChecklistCalificacion> {
  const { data } = await apiClient.get<ChecklistCalificacion>(`/proveedores/${idProveedor}/documentos-calificacion`);
  return data;
}

export interface ResultadoCalificarDocumento {
  id_documento_proveedor: number;
  estado_calificacion: 'Aprobado' | 'Rechazado' | null;
  comentario_calificacion: string | null;
  fecha_calificacion: string | null;
}

export async function calificarDocumento(
  idDocumentoProveedor: number,
  payload: PayloadCalificar
): Promise<ResultadoCalificarDocumento> {
  const { data } = await apiClient.post<ResultadoCalificarDocumento>(
    `/proveedores/documentos-calificacion/${idDocumentoProveedor}`,
    payload
  );
  return data;
}

export async function registrarCalificacionDocumentos(idProveedor: number): Promise<void> {
  await apiClient.post(`/proveedores/${idProveedor}/documentos-calificacion/registrar`);
}

/**
 * Trae el PDF como blob (con el header de autorización, algo que un
 * <iframe src="..."> plano no puede hacer) y devuelve una URL de blob
 * lista para meter en el visor inline. El caller es responsable de
 * revocarla (URL.revokeObjectURL) cuando ya no la necesite.
 */
export async function obtenerUrlVisorDocumento(idDocumentoProveedor: number): Promise<string> {
  const { data } = await apiClient.get(`/proveedores/documentos-calificacion/${idDocumentoProveedor}/ver`, {
    responseType: 'blob',
  });
  const blobPdf = new Blob([data], { type: 'application/pdf' });
  return window.URL.createObjectURL(blobPdf);
}