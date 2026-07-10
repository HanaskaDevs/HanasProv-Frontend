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
