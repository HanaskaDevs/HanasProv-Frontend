import { z } from 'zod';

/**
 * Reglas de contraseña del portal, en UN SOLO lugar.
 *
 * Tienen que coincidir exactamente con las del backend
 * (App\Shared\ReglaPasswordSegura): mínimo 8 caracteres, al menos un número
 * y al menos un carácter especial. Si se separaran, el formulario dejaría
 * pasar algo que el servidor después rechaza, y el usuario no entendería
 * por qué.
 *
 * SOLO APLICA A CONTRASEÑAS NUEVAS. A quien ya tiene cuenta no se le pide
 * cambiar nada: el login no valida esto.
 *
 * Vive en utils/ y no junto al componente porque un archivo que exporta un
 * componente Y constantes rompe el refresco en caliente de Vite.
 */
export const REQUISITOS_PASSWORD = [
  { etiqueta: 'Al menos 8 caracteres', cumple: (v: string) => v.length >= 8 },
  { etiqueta: 'Al menos un número', cumple: (v: string) => /[0-9]/.test(v) },
  { etiqueta: 'Al menos un carácter especial (!, @, #, $...)', cumple: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

/** El mensaje único cuando la contraseña no cumple. */
export const MENSAJE_PASSWORD_INVALIDA =
  'El formato de la contraseña es incorrecto: debe tener al menos 8 caracteres, un número y un carácter especial.';

/**
 * Validación de Zod para los tres formularios que definen contraseña
 * (activar cuenta, restablecer, cambiar desde el perfil).
 *
 * Un solo mensaje para las tres reglas a propósito: el usuario tiene la
 * lista de requisitos a la vista debajo del campo, marcándose sola mientras
 * escribe, así que ahí ya ve CUÁL le falta. Un error distinto por regla solo
 * repetiría lo que la lista ya muestra.
 */
export const passwordSegura = z
  .string()
  .min(8, MENSAJE_PASSWORD_INVALIDA)
  .regex(/[0-9]/, MENSAJE_PASSWORD_INVALIDA)
  .regex(/[^A-Za-z0-9]/, MENSAJE_PASSWORD_INVALIDA);
