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