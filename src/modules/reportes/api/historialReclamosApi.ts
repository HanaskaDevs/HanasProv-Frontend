import apiClient from '../../../shared/api/apiClient';

const BASE = '/reportes/historial-reclamos';

/** Un renglón de la tabla: un proveedor con reclamos. */
export interface ProveedorConReclamos {
  id_proveedor: number;
  razon_social: string | null;
  nombre_comercial: string | null;
  ruc: string | null;
  total: number;
  abiertos: number;
  cerrados: number;
  ultimo_reclamo: string | null;
}

export interface ImagenMensajeReclamo {
  id: number;
  nombre: string | null;
  url: string;
}

export interface MensajeHistorial {
  id_reclamo_mensaje: number;
  autor: string;
  fecha: string | null;
  mensaje: string;
  imagenes: ImagenMensajeReclamo[];
}

export interface ReclamoHistorial {
  id_reclamo: number;
  asunto: string;
  tipo_reclamo: string | null;
  impacto_proveedor: string | null;
  estado: string;
  creado_por: string | null;
  fecha_creacion: string | null;
  fecha_cierre: string | null;
  total_mensajes: number;
  total_imagenes: number;
  mensajes: MensajeHistorial[];
}

export interface HistorialDeProveedor {
  proveedor: {
    id_proveedor: number;
    razon_social: string | null;
    nombre_comercial: string | null;
    ruc: string | null;
  };
  reclamos: ReclamoHistorial[];
}

export async function listarProveedores(): Promise<ProveedorConReclamos[]> {
  const { data } = await apiClient.get<ProveedorConReclamos[]>(BASE);
  return data;
}

export async function obtenerHistorial(idProveedor: number): Promise<HistorialDeProveedor> {
  const { data } = await apiClient.get<HistorialDeProveedor>(`${BASE}/proveedor/${idProveedor}`);
  return data;
}

/**
 * Descarga un PDF del backend y lo guarda.
 *
 * El nombre real lo decide el servidor (Content-Disposition), pero el
 * navegador necesita uno en el enlace: se pasa el mismo que arma el
 * backend para que coincida.
 */
async function descargar(url: string, nombreArchivo: string): Promise<void> {
  const { data } = await apiClient.get(url, { responseType: 'blob' });
  const objectUrl = window.URL.createObjectURL(data);
  const enlace = document.createElement('a');
  enlace.href = objectUrl;
  enlace.download = nombreArchivo;
  enlace.click();
  window.URL.revokeObjectURL(objectUrl);
}

/** PDF de UN reclamo: su conversación completa con las imágenes. */
export async function descargarPdfReclamo(idReclamo: number): Promise<void> {
  await descargar(`${BASE}/reclamo/${idReclamo}/pdf`, `reclamo-${idReclamo}.pdf`);
}

/** PDF con TODO el historial del proveedor. Puede pesar: lleva las fotos. */
export async function descargarPdfProveedor(idProveedor: number, nombre: string): Promise<void> {
  await descargar(`${BASE}/proveedor/${idProveedor}/pdf`, `historial-reclamos-${nombre}.pdf`);
}

/** Abre una imagen de un mensaje en una pestaña nueva (endpoint autenticado). */
export async function verImagen(url: string): Promise<void> {
  const { data } = await apiClient.get(url.replace(/^\/api/, ''), { responseType: 'blob' });
  window.open(window.URL.createObjectURL(data), '_blank');
}
