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

export async function crearInterno(email: string, idRol: number, idEmpresas: number[]): Promise<UsuarioInterno> {
  const { data } = await apiClient.post<UsuarioInterno>('/usuarios/internos', {
    email,
    id_rol: idRol,
    id_empresas: idEmpresas,
  });
  return data;
}

export async function listarExternos(): Promise<UsuarioExterno[]> {
  const { data } = await apiClient.get<UsuarioExterno[]>('/usuarios/externos');
  return data;
}

export async function crearExterno(email: string, idEmpresas: number[]): Promise<UsuarioExterno> {
  const { data } = await apiClient.post<UsuarioExterno>('/usuarios/externos', {
    email,
    id_empresas: idEmpresas,
  });
  return data;
}

export async function inactivarUsuario(id: number): Promise<{ message: string }> {
  const { data } = await apiClient.patch(`/usuarios/${id}/inactivar`);
  return data;
}
export async function reactivarUsuario(id: number): Promise<{ message: string }> {
  const { data } = await apiClient.patch(`/usuarios/${id}/reactivar`);
  return data;
}

export async function reenviarActivacion(id: number): Promise<{ message: string }> {
  const { data } = await apiClient.post(`/usuarios/${id}/reenviar-activacion`);
  return data;
}

export async function agregarEmpresaUsuario(id: number, idEmpresa: number, idRol?: number): Promise<{ message: string }> {
  const { data } = await apiClient.post(`/usuarios/${id}/empresas`, {
    id_empresa: idEmpresa,
    id_rol: idRol,
  });
  return data;
}
export interface UsuarioDetalle {
  id: number;
  email: string;
  nombre_completo: string;
  tipo_usuario: 'Interno' | 'Proveedor';
  activo: boolean;
  empresas: { id_empresa: number; razon_social: string; nombre_comercial: string | null; id_rol: number; nombre_rol: string; bodegas_asignadas: string[] }[];
}

export async function obtenerDetalleInterno(id: number): Promise<UsuarioDetalle> {
  const { data } = await apiClient.get<UsuarioDetalle>(`/usuarios/internos/${id}`);
  return data;
}

export async function obtenerDetalleExterno(id: number): Promise<UsuarioDetalle> {
  const { data } = await apiClient.get<UsuarioDetalle>(`/usuarios/externos/${id}`);
  return data;
}

export async function actualizarEmailUsuario(id: number, email: string): Promise<{ message: string }> {
  const { data } = await apiClient.put(`/usuarios/${id}/email`, { email });
  return data;
}

export async function actualizarRolUsuarioEmpresa(id: number, idEmpresa: number, idRol: number): Promise<{ message: string }> {
  const { data } = await apiClient.put(`/usuarios/${id}/empresas/${idEmpresa}`, { id_rol: idRol });
  return data;
}

export async function actualizarBodegasUsuarioEmpresa(id: number, idEmpresa: number, codigosBodega: string[]): Promise<{ message: string }> {
  const { data } = await apiClient.put(`/usuarios/${id}/empresas/${idEmpresa}/bodegas`, { codigos_bodega: codigosBodega });
  return data;
}

export async function quitarAccesoUsuarioEmpresa(id: number, idEmpresa: number): Promise<{ message: string }> {
  const { data } = await apiClient.delete(`/usuarios/${id}/empresas/${idEmpresa}`);
  return data;
}