import apiClient from '../../../shared/api/apiClient';
import type { BotRegla, GuiaPaso, HomeSlide, Politica } from '../types';

// ---- Home Slides ----

export async function listarSlides(): Promise<HomeSlide[]> {
  const { data } = await apiClient.get<HomeSlide[]>('/configuraciones/home-slides');
  return data;
}

export async function crearSlide(payload: {
  eyebrow: string;
  titulo: string;
  descripcion: string;
  orden?: number;
  media?: File;
}): Promise<HomeSlide> {
  const formData = new FormData();
  formData.append('eyebrow', payload.eyebrow);
  formData.append('titulo', payload.titulo);
  formData.append('descripcion', payload.descripcion);
  if (payload.orden != null) formData.append('orden', String(payload.orden));
  if (payload.media) formData.append('media', payload.media);

  const { data } = await apiClient.post<HomeSlide>('/configuraciones/home-slides', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function actualizarSlide(
  id: number,
  payload: { eyebrow: string; titulo: string; descripcion: string; orden?: number; media?: File }
): Promise<HomeSlide> {
  const formData = new FormData();
  formData.append('eyebrow', payload.eyebrow);
  formData.append('titulo', payload.titulo);
  formData.append('descripcion', payload.descripcion);
  if (payload.orden != null) formData.append('orden', String(payload.orden));
  if (payload.media) formData.append('media', payload.media);
  formData.append('_method', 'PUT');

  const { data } = await apiClient.post<HomeSlide>(`/configuraciones/home-slides/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function eliminarSlide(id: number): Promise<{ message: string }> {
  const { data } = await apiClient.delete(`/configuraciones/home-slides/${id}`);
  return data;
}

// ---- Imagen de Login ----

export async function obtenerImagenLogin(): Promise<{ url: string | null }> {
  const { data } = await apiClient.get('/configuraciones/login-imagen');
  return data;
}

export async function actualizarImagenLogin(imagen: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('imagen', imagen);

  const { data } = await apiClient.post('/configuraciones/login-imagen', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

// ---- Bot Reglas ----

export async function listarReglasBot(): Promise<BotRegla[]> {
  const { data } = await apiClient.get<BotRegla[]>('/configuraciones/bot-reglas');
  return data;
}

export async function crearReglaBot(payload: {
  tipo: 'Persona' | 'Respaldo';
  palabra_clave?: string;
  contenido: string;
  orden?: number;
}): Promise<BotRegla> {
  const { data } = await apiClient.post<BotRegla>('/configuraciones/bot-reglas', payload);
  return data;
}

export async function actualizarReglaBot(
  id: number,
  payload: { palabra_clave?: string; contenido?: string; orden?: number; activo?: boolean }
): Promise<BotRegla> {
  const { data } = await apiClient.put<BotRegla>(`/configuraciones/bot-reglas/${id}`, payload);
  return data;
}

export async function eliminarReglaBot(id: number): Promise<{ message: string }> {
  const { data } = await apiClient.delete(`/configuraciones/bot-reglas/${id}`);
  return data;
}

// ---- Guía de inicio ----

export async function listarPasosGuia(): Promise<GuiaPaso[]> {
  const { data } = await apiClient.get<GuiaPaso[]>('/configuraciones/guia-pasos');
  return data;
}

export async function crearPasoGuia(payload: {
  target_id: string;
  titulo: string;
  texto: string;
  orden?: number;
}): Promise<GuiaPaso> {
  const { data } = await apiClient.post<GuiaPaso>('/configuraciones/guia-pasos', payload);
  return data;
}

export async function actualizarPasoGuia(
  id: number,
  payload: { target_id?: string; titulo?: string; texto?: string; orden?: number; activo?: boolean }
): Promise<GuiaPaso> {
  const { data } = await apiClient.put<GuiaPaso>(`/configuraciones/guia-pasos/${id}`, payload);
  return data;
}

export async function eliminarPasoGuia(id: number): Promise<{ message: string }> {
  const { data } = await apiClient.delete(`/configuraciones/guia-pasos/${id}`);
  return data;
}
// ---- Políticas (administración) ----

export async function listarPoliticas(): Promise<Politica[]> {
  const { data } = await apiClient.get<Politica[]>('/configuraciones/politicas');
  return data;
}

export async function crearPolitica(payload: {
  titulo: string;
  descripcion: string;
  orden?: number;
}): Promise<Politica> {
  const { data } = await apiClient.post<Politica>('/configuraciones/politicas', payload);
  return data;
}

export async function actualizarPolitica(
  id: number,
  payload: { titulo?: string; descripcion?: string; orden?: number; activo?: boolean }
): Promise<Politica> {
  const { data } = await apiClient.put<Politica>(`/configuraciones/politicas/${id}`, payload);
  return data;
}

export async function eliminarPolitica(id: number): Promise<{ message: string }> {
  const { data } = await apiClient.delete(`/configuraciones/politicas/${id}`);
  return data;
}
export async function extraerTextoPdfPolitica(pdf: File): Promise<{ texto: string }> {
  const formData = new FormData();
  formData.append('pdf', pdf);

  const { data } = await apiClient.post<{ texto: string }>('/configuraciones/politicas/extraer-pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}