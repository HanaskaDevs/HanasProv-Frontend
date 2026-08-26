// src/modules/legal/api/derechosApi.ts
import apiClient from '../../../shared/api/apiClient';

/**
 * Derechos que reconoce la LOPDP. Los valores tienen que coincidir con la
 * lista cerrada de SolicitudDerechosRequest::DERECHOS en el backend: si se
 * agrega uno, se agrega en los dos lados.
 */
export const DERECHOS = [
  { valor: 'informacion', etiqueta: 'Información — saber qué datos míos tratan y para qué' },
  { valor: 'acceso', etiqueta: 'Acceso — obtener copia de mis datos' },
  { valor: 'rectificacion', etiqueta: 'Rectificación o actualización — corregir un dato' },
  { valor: 'eliminacion', etiqueta: 'Eliminación — que borren mis datos' },
  { valor: 'oposicion', etiqueta: 'Oposición — oponerme a un tratamiento' },
  { valor: 'portabilidad', etiqueta: 'Portabilidad — recibir mis datos en formato reutilizable' },
  { valor: 'suspension', etiqueta: 'Suspensión del tratamiento' },
  { valor: 'revocatoria', etiqueta: 'Revocatoria del consentimiento' },
  { valor: 'decision_automatizada', etiqueta: 'Revisión de una decisión automatizada del portal' },
] as const;

export type ValorDerecho = (typeof DERECHOS)[number]['valor'];

export interface SolicitudDerechos {
  nombre_completo: string;
  email: string;
  cedula: string;
  celular: string;
  derecho: ValorDerecho | '';
  detalle: string;
  declaracion: boolean;
  recaptcha_token?: string;
}

export async function enviarSolicitudDerechos(
  payload: SolicitudDerechos
): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/derechos-datos', payload);
  return data;
}
