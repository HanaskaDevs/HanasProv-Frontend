import apiClient from './apiClient';

export interface MensajeChat {
  rol: 'usuario' | 'hana';
  contenido: string;
}

export async function enviarMensaje(mensaje: string, historial: MensajeChat[]): Promise<string> {
  const { data } = await apiClient.post<{ respuesta: string }>('/asistente/mensaje', {
    mensaje,
    historial,
  });
  return data.respuesta;
}

/**
 * Se llama sola al montar HanaBot, sin que el usuario abra el chat.
 * Casi siempre devuelve null; solo trae texto la primera vez que un
 * proveedor recién Aprobado entra al portal (ver AsistenteService::
 * obtenerBienvenidaProactiva en el backend).
 */
export async function obtenerBienvenidaProactiva(): Promise<string | null> {
  const { data } = await apiClient.get<{ mensaje: string | null }>('/asistente/bienvenida-proactiva');
  return data.mensaje;
}