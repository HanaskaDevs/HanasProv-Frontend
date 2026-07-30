import apiClient from '../../../shared/api/apiClient';
import type { Politica } from '../types';

export async function listarPoliticas(): Promise<Politica[]> {
  const { data } = await apiClient.get<Politica[]>('/politicas');
  return data;
}