import apiClient from '../../../shared/api/apiClient';
import type { LoginResponse, MeResponse } from '../types';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function me(): Promise<MeResponse> {
  const { data } = await apiClient.get<MeResponse>('/auth/me');
  return data;
}

export async function olvidePassword(email: string): Promise<{ message: string }> {
  const { data } = await apiClient.post('/auth/olvide-password', { email });
  return data;
}

export async function activarCuenta(payload: {
  email: string;
  codigo: string;
  password_nueva: string;
  password_nueva_confirmation: string;
  nombre_completo?: string;
  cargo?: string;
  telefono?: string;
}): Promise<{ message: string }> {
  const { data } = await apiClient.post('/auth/activar-cuenta', payload);
  return data;
}

export async function cambiarPassword(
  passwordActual: string,
  passwordNueva: string,
  passwordNuevaConfirmation: string
): Promise<{ message: string }> {
  const { data } = await apiClient.post('/auth/cambiar-password', {
    password_actual: passwordActual,
    password_nueva: passwordNueva,
    password_nueva_confirmation: passwordNuevaConfirmation,
  });
  return data;
}

export async function cambiarEmpresa(idEmpresa: number): Promise<{ id_empresa_activa: number }> {
  const { data } = await apiClient.post('/auth/cambiar-empresa', { id_empresa: idEmpresa });
  return data;
}
