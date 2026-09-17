import axios from 'axios';

/**
 * Saca el mensaje que mandó el backend en un 422 (el primero de `errors`,
 * o `message`), y si no hay ninguno devuelve el texto por defecto.
 *
 * Antes los formularios de la ficha mostraban SIEMPRE un texto fijo ("No se
 * pudo guardar. Intenta de nuevo."), con lo que el proveedor no podía saber
 * si le faltó aceptar las políticas, si un dato no pasó la validación del
 * servidor o si fue un error real. Con el mensaje del backend se entera de
 * qué corregir.
 */
export function mensajeDeError(error: unknown, porDefecto: string): string {
  if (axios.isAxiosError(error) && error.response?.status === 422) {
    const datos = error.response.data as { errors?: Record<string, string[]>; message?: string } | undefined;
    const primero = datos?.errors ? Object.values(datos.errors).flat()[0] : undefined;
    return primero ?? datos?.message ?? porDefecto;
  }

  return porDefecto;
}
