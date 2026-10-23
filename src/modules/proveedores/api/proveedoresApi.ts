// src/modules/proveedores/api/proveedoresApi.ts
import apiClient from '../../../shared/api/apiClient';
import type { FichaProveedor, Seccion1Data } from '../../miFicha/types';
import type { ChecklistCalificacion, PayloadCalificar, ProductosCalificacion, ProveedorListado } from '../types';

export async function listarProveedores(): Promise<ProveedorListado[]> {
  const { data } = await apiClient.get<ProveedorListado[]>('/proveedores');
  return data;
}

export async function obtenerFichaCalificacion(idProveedor: number): Promise<FichaProveedor> {
  const { data } = await apiClient.get<FichaProveedor>(`/proveedores/${idProveedor}/ficha-calificacion`);
  return data;
}

/*
 * Edición interna de la ficha (Compras y quienes califican la ficha), solo
 * mientras el proveedor no esté aprobado. Devuelven la ficha completa, igual
 * que obtenerFichaCalificacion.
 */
export async function editarFichaSeccion1(idProveedor: number, payload: Partial<Seccion1Data>): Promise<FichaProveedor> {
  const { data } = await apiClient.put<FichaProveedor>(`/proveedores/${idProveedor}/ficha/seccion-1`, payload);
  return data;
}

export async function editarFichaSeccion2(idProveedor: number, idClases: number[]): Promise<FichaProveedor> {
  const { data } = await apiClient.put<FichaProveedor>(`/proveedores/${idProveedor}/ficha/seccion-2`, { id_clases: idClases });
  return data;
}

export async function editarFichaSeccion3(idProveedor: number, idCategorias: number[]): Promise<FichaProveedor> {
  const { data } = await apiClient.put<FichaProveedor>(`/proveedores/${idProveedor}/ficha/seccion-3`, {
    id_categorias: idCategorias,
  });
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

export async function obtenerProductosCalificacion(idProveedor: number): Promise<ProductosCalificacion> {
  const { data } = await apiClient.get<ProductosCalificacion>(`/proveedores/${idProveedor}/productos-calificacion`);
  return data;
}

export async function registrarCalificacionProductos(idProveedor: number): Promise<void> {
  await apiClient.post(`/proveedores/${idProveedor}/productos-calificacion/registrar`);
}

export interface ResultadoCalificarProducto {
  id_producto: number;
  estado_calificacion: 'Aprobado' | 'Rechazado' | null;
  comentario_calificacion: string | null;
  fecha_calificacion: string | null;
}

export async function calificarProducto(
  idProducto: number,
  payload: PayloadCalificar
): Promise<ResultadoCalificarProducto> {
  const { data } = await apiClient.post<ResultadoCalificarProducto>(
    `/proveedores/productos-calificacion/${idProducto}`,
    payload
  );
  return data;
}

export async function obtenerUrlVisorDocumentoProducto(idDocumentoProducto: number): Promise<string> {
  const { data } = await apiClient.get(`/proveedores/productos-calificacion/documento/${idDocumentoProducto}/ver`, {
    responseType: 'blob',
  });
  const blobPdf = new Blob([data], { type: 'application/pdf' });
  return window.URL.createObjectURL(blobPdf);
}

/**
 * Calidad completa la fecha de caducidad de un documento de producto que no
 * la tiene (análisis cargados antes de que se pidiera): sin ella no se puede
 * aprobar el producto.
 */
export async function asignarFechaCaducidadDocumentoProducto(
  idDocumentoProducto: number,
  fechaCaducidad: string
): Promise<{ id_documento_producto: number; fecha_caducidad: string }> {
  const { data } = await apiClient.put(`/proveedores/productos-calificacion/documento/${idDocumentoProducto}/fecha-caducidad`, {
    fecha_caducidad: fechaCaducidad,
  });
  return data;
}
