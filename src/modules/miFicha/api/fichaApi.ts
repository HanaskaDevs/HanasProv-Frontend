import apiClient from '../../../shared/api/apiClient';
import type { FichaProveedor, Seccion1Data } from '../types';

export async function obtenerMiFicha(): Promise<FichaProveedor> {
  const { data } = await apiClient.get<FichaProveedor>('/mi-ficha');
  return data;
}

export async function guardarSeccion1(payload: Partial<Seccion1Data>): Promise<FichaProveedor> {
  const { data } = await apiClient.put<FichaProveedor>('/mi-ficha/seccion-1', payload);
  return data;
}

export async function guardarSeccion2(idClases: number[]): Promise<FichaProveedor> {
  const { data } = await apiClient.put<FichaProveedor>('/mi-ficha/seccion-2', { id_clases: idClases });
  return data;
}

export async function guardarSeccion3(idCategorias: number[]): Promise<FichaProveedor> {
  const { data } = await apiClient.put<FichaProveedor>('/mi-ficha/seccion-3', { id_categorias: idCategorias });
  return data;
}

export interface ContactosData {
  representante_legal: string;
  correo_representante: string;
  telefono_representante: string;
  contacto_venta: string;
  correo_venta: string;
  telefono_contacto_venta: string;
  contacto_calidad: string;
  correo_calidad: string;
  telefono_contacto_calidad: string;
  contacto_contabilidad: string;
  correo_contabilidad: string;
  telefono_contabilidad: string;
}

/** Solo para un proveedor YA APROBADO -> el resto de la Ficha
 *  (Datos Generales, Clase, Categoría) no se puede editar desde acá. */
export async function guardarContactos(payload: ContactosData): Promise<FichaProveedor> {
  const { data } = await apiClient.put<FichaProveedor>('/mi-ficha/contactos', payload);
  return data;
}