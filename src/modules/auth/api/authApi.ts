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
  /** Solo para usuarios proveedor en su primera activación. */
  ruc?: string;
  razon_social?: string;
}): Promise<{ message: string }> {
  const { data } = await apiClient.post('/auth/activar-cuenta', payload);
  return data;
}

/**
 * Paso 1 de la pantalla de activación: comprueba el código contra el
 * servidor antes de hacerle llenar el resto, y responde si además hay que
 * pedirle el RUC y la razón social (solo a un proveedor que activa por
 * primera vez).
 *
 * Sin esta llamada, un código vencido recién se descubría al final, después
 * de completar tres pantallas.
 */
export async function validarCodigoActivacion(
  email: string,
  codigo: string
): Promise<{ requiere_datos_proveedor: boolean }> {
  const { data } = await apiClient.post('/auth/validar-codigo', { email, codigo });
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
