import apiClient from '../../../shared/api/apiClient';

export interface PiezaBanner {
  id_banner_informativo: number;
  orden: number;
  titulo: string | null;
  descripcion: string | null;
  tipo_media: 'imagen' | 'video' | null;
  url_media: string | null;
  activo: boolean;
}

export type AudienciaBanner = 'todos' | 'internos' | 'proveedores';

/** 'una_vez': se cierra y no vuelve. 'siempre': reaparece en cada login. */
export type FrecuenciaBanner = 'una_vez' | 'siempre';

/** Formatos que acepta el backend (ver BannerInformativoController). */
export const TIPOS_ACEPTADOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
] as const;

export interface BannerInformativo {
  activo: boolean;
  titulo: string | null;
  mensaje: string | null;
  audiencia: AudienciaBanner | null;
  frecuencia: FrecuenciaBanner | null;
  /**
   * Tope real de subida del servidor, en MB. Lo calcula el backend desde
   * php.ini: un número escrito a mano acá mentiría el día que cambie la
   * configuración del servidor. Solo viene en la vista de administración.
   */
  max_mb?: number;
  /**
   * Marca de tiempo que cambia con CUALQUIER edición. Es lo que decide si
   * a alguien que ya cerró el banner hay que volver a mostrárselo.
   */
  version: string | null;
  piezas: PiezaBanner[];
}

/** Lo que pide cualquier usuario al entrar. Solo trae las piezas activas. */
export async function obtenerBanner(): Promise<BannerInformativo> {
  const { data } = await apiClient.get<BannerInformativo>('/banner-informativo');
  return data;
}

// ---- Administración (Sistemas) ----

/** Incluye las piezas desactivadas, que el usuario común no ve. */
export async function obtenerBannerAdmin(): Promise<BannerInformativo> {
  const { data } = await apiClient.get<BannerInformativo>('/configuraciones/banner-informativo');
  return data;
}

export async function guardarBanner(payload: {
  activo: boolean;
  audiencia: AudienciaBanner;
  frecuencia: FrecuenciaBanner;
  titulo?: string | null;
  mensaje?: string | null;
}): Promise<BannerInformativo> {
  const { data } = await apiClient.put<BannerInformativo>('/configuraciones/banner-informativo', payload);
  return data;
}

/**
 * Las piezas viajan como multipart por el archivo. La actualización usa
 * POST y no PUT a propósito: PHP no arma $_FILES en una petición PUT, así
 * que un PUT con archivo llega sin el archivo.
 */
export async function crearPieza(
  datos: { media: File; titulo?: string; descripcion?: string; orden?: number },
  onProgreso?: (porcentaje: number) => void
): Promise<PiezaBanner> {
  const { data } = await apiClient.post(
    '/configuraciones/banner-informativo/piezas',
    aFormData(datos),
    opcionesDeProgreso(onProgreso)
  );
  return data;
}

export async function actualizarPieza(
  id: number,
  datos: { media?: File; titulo?: string; descripcion?: string; orden?: number; activo?: boolean }
): Promise<PiezaBanner> {
  const { data } = await apiClient.post(`/configuraciones/banner-informativo/piezas/${id}`, aFormData(datos));
  return data;
}

export async function eliminarPieza(id: number): Promise<{ message: string }> {
  const { data } = await apiClient.delete(`/configuraciones/banner-informativo/piezas/${id}`);
  return data;
}

/**
 * Reporta el avance de la subida. Sin esto, un archivo de varios MB deja
 * la pantalla sin señales de vida y parece colgada: fue justo lo que se
 * reportó.
 */
function opcionesDeProgreso(onProgreso?: (porcentaje: number) => void) {
  if (!onProgreso) return undefined;

  return {
    onUploadProgress: (evento: { loaded: number; total?: number }) => {
      // total puede no venir si el servidor no informa el tamaño; en ese
      // caso no se inventa un porcentaje.
      if (!evento.total) return;
      onProgreso(Math.round((evento.loaded * 100) / evento.total));
    },
  };
}

function aFormData(datos: Record<string, unknown>): FormData {
  const form = new FormData();

  Object.entries(datos).forEach(([clave, valor]) => {
    if (valor === undefined || valor === null) return;
    // Los booleanos viajan como 1/0: FormData los mandaría como "true" y
    // la validación 'boolean' de Laravel no acepta esa cadena.
    form.append(clave, typeof valor === 'boolean' ? (valor ? '1' : '0') : (valor as string | Blob));
  });

  return form;
}
