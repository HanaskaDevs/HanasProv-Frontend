import apiClient from '../../../shared/api/apiClient';

export interface UsuarioInterno {
  id: number;
  email: string;
  nombre_completo: string;
  cargo: string | null;
  telefono: string | null;
  activo: boolean;
  requiere_activacion: boolean;
  ultimo_acceso: string | null;
  rol: { id_rol: number | string; nombre_rol: string } | null;
  fecha_creacion: string;
}

export interface UsuarioExterno {
  id: number;
  email: string;
  nombre_completo: string;
  activo: boolean;
  requiere_activacion: boolean;
  ultimo_acceso: string | null;
  ficha_completada: boolean;
  proveedor: { id_proveedor: number; razon_social: string; porcentaje_completado_ficha: number } | null;
  rol: { id_rol: number | string; nombre_rol: string } | null;
  fecha_creacion: string;
}

export async function listarInternos(): Promise<UsuarioInterno[]> {
  const { data } = await apiClient.get<UsuarioInterno[]>('/usuarios/internos');
  return data;
}

export async function crearInterno(email: string, idRol: number): Promise<UsuarioInterno> {
  const { data } = await apiClient.post<UsuarioInterno>('/usuarios/internos', {
    email,
    id_rol: idRol,
  });
  return data;
}

export async function listarExternos(): Promise<UsuarioExterno[]> {
  const { data } = await apiClient.get<UsuarioExterno[]>('/usuarios/externos');
  return data;
}

export async function crearExterno(email: string): Promise<UsuarioExterno> {
  const { data } = await apiClient.post<UsuarioExterno>('/usuarios/externos', { email });
  return data;
}

export async function inactivarUsuario(id: number): Promise<{ message: string }> {
  const { data } = await apiClient.patch(`/usuarios/${id}/inactivar`);
  return data;
}
