import apiClient from './apiClient';

/**
 * Tabla que Hana trae cuando usó una herramienta de consulta. Es lo que
 * habilita el botón de descarga en Excel bajo el mensaje.
 */
export interface TablaAsistente {
  titulo: string;
  /** Filas con claves = nombres de columna, tal como las armó el backend. */
  filas: Record<string, string | number>[];
}

export interface MensajeChat {
  rol: 'usuario' | 'hana';
  contenido: string;
  /** Tabla descargable, si esa respuesta trajo datos de una consulta. */
  tabla?: TablaAsistente | null;
}

export interface RespuestaAsistente {
  texto: string;
  tabla: TablaAsistente | null;
}

export async function enviarMensaje(
  mensaje: string,
  historial: MensajeChat[]
): Promise<RespuestaAsistente> {
  const { data } = await apiClient.post<{ respuesta: string; tabla: TablaAsistente | null }>('/asistente/mensaje', {
    mensaje,
    historial,
  });
  return { texto: data.respuesta, tabla: data.tabla ?? null };
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