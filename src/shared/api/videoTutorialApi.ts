import apiClient from './apiClient';

export interface VideoTutorial {
  /** La URL original, para el enlace "Abrir en YouTube". Null = sin video. */
  url: string | null;
  video_id: string | null;
  /** Lista para el src del iframe: la arma el backend, acá no se parsea nada. */
  url_embed: string | null;
}

/**
 * Lectura del video tutorial. Va por el cliente AUTENTICADO (y no por
 * publicConfigApi) porque solo se usa dentro de la plataforma, con sesión
 * abierta: no hace falta exponerlo a cualquiera que pase por la landing.
 */
export async function obtenerVideoTutorial(): Promise<VideoTutorial> {
  const { data } = await apiClient.get<VideoTutorial>('/video-tutorial');
  return data;
}
