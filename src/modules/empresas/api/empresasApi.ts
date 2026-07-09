import apiClient from '../../../shared/api/apiClient';
import type { Empresa, EmpresaPayload } from '../types';

export async function listarEmpresas(): Promise<Empresa[]> {
  const { data } = await apiClient.get<Empresa[]>('/empresas');
  return data;
}

export async function crearEmpresa(payload: EmpresaPayload): Promise<Empresa> {
  const { data } = await apiClient.post<Empresa>('/empresas', payload);
  return data;
}

export async function actualizarEmpresa(idEmpresa: number, payload: EmpresaPayload): Promise<Empresa> {
  const { data } = await apiClient.put<Empresa>(`/empresas/${idEmpresa}`, payload);
  return data;
}

export async function inactivarEmpresa(idEmpresa: number): Promise<void> {
  await apiClient.delete(`/empresas/${idEmpresa}`);
}