import apiClient from '../../../shared/api/apiClient';

export interface Rol {
  id_rol: number;
  nombre_rol: string;
  descripcion: string | null;
}

export async function listarRoles(): Promise<Rol[]> {
  const { data } = await apiClient.get<Rol[]>('/roles');
  return data;
}
