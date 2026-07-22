import axios from 'axios';

// Cliente separado del apiClient autenticado: estas rutas son públicas
// (Landing, Login, Tour) y no deben depender de un token de sesión.
const publicClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8001/api',
});

export interface HomeSlidePublico {
  Id_Home_Slide: number;
  Eyebrow: string;
  Titulo: string;
  Descripcion: string;
  Ruta_Media: string | null;
  Tipo_Media: 'imagen' | 'video' | null;
}

export interface GuiaPasoPublico {
  Target_Id: string;
  Titulo: string;
  Texto: string;
}

export async function obtenerHomeSlides(): Promise<HomeSlidePublico[]> {
  const { data } = await publicClient.get<HomeSlidePublico[]>('/public-config/home-slides');
  return data;
}

export async function obtenerImagenLoginPublica(): Promise<string | null> {
  const { data } = await publicClient.get<{ url: string | null }>('/public-config/login-imagen');
  return data.url;
}

export async function obtenerGuiaPasos(): Promise<GuiaPasoPublico[]> {
  const { data } = await publicClient.get<GuiaPasoPublico[]>('/public-config/guia-pasos');
  return data;
}