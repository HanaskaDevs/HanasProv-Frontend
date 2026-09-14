/**
 * Formato visual de los teléfonos de la Ficha de Proveedor.
 *
 * LO QUE SE GUARDA SON SOLO DÍGITOS. El espaciado es de pantalla, nunca
 * viaja al backend ni a la base, por dos razones:
 *
 *  - Telefono_Representante, Telefono_Contacto_Venta y
 *    Telefono_Contacto_Calidad son nvarchar(10) y el backend los valida
 *    con max:10 -> "095 899 1687" son 12 caracteres y el guardado
 *    fallaría.
 *  - Business Central recibe el número en Phone_No; ahí un número con
 *    espacios ensucia el dato de un sistema que no es nuestro.
 *
 * CÓMO SE AGRUPA (decisión del usuario, 12-sep-2026):
 *
 *    Celular (empieza en 09, 10 dígitos) ....... 095 899 1687
 *    Fijo (cualquier otro, 9 dígitos) .......... 02 246 8000
 *
 * El tipo se decide por el PREFIJO y no por el largo total. Si se
 * decidiera por el largo, el número saltaría de "09 589 9168" a
 * "095 899 1687" al teclear el décimo dígito, y el campo parecería
 * corregirse solo delante del usuario. Mirando el segundo dígito, el
 * agrupado queda fijo desde el principio y no se mueve más.
 */

/** Máximo de dígitos que acepta un teléfono ecuatoriano. */
export const MAX_DIGITOS_TELEFONO = 10;

/** Lo que se muestra de fondo en el campo vacío, ya con el formato. */
export const PLACEHOLDER_TELEFONO = '09 999 9999';

export function soloDigitos(texto: string): string {
  return texto.replace(/\D/g, '');
}

/**
 * Agrupa los dígitos para mostrarlos. Funciona también a medio escribir
 * (2 dígitos, 5 dígitos...), así el espacio aparece solo mientras el
 * usuario teclea en vez de saltar todo junto al final.
 */
export function formatearTelefono(valor: string): string {
  const digitos = soloDigitos(valor).slice(0, MAX_DIGITOS_TELEFONO);

  if (digitos.length <= 2) {
    return digitos;
  }

  // Los celulares del país empiezan en 09; el resto son fijos.
  const esCelular = digitos.startsWith('09');
  const [largoPrimerGrupo, largoSegundoGrupo] = esCelular ? [3, 3] : [2, 3];

  const primero = digitos.slice(0, largoPrimerGrupo);
  const segundo = digitos.slice(largoPrimerGrupo, largoPrimerGrupo + largoSegundoGrupo);
  const tercero = digitos.slice(largoPrimerGrupo + largoSegundoGrupo);

  return [primero, segundo, tercero].filter(Boolean).join(' ');
}

/**
 * Traduce lo que quedó escrito en el input a los dígitos que hay que
 * guardar.
 *
 * EL CASO DEL BORRADO SOBRE UN ESPACIO: si el cursor está justo después
 * de un separador y se presiona retroceso, el navegador borra el
 * ESPACIO, no un dígito -> los dígitos no cambian, el formateo vuelve a
 * poner el espacio en su lugar y la tecla parece no hacer nada. Cuando
 * se detecta ese caso (el texto se acortó pero los dígitos son los
 * mismos) se borra además el último dígito, que es lo que la persona
 * estaba tratando de hacer.
 */
export function digitosTrasEditar(textoNuevo: string, textoAnterior: string): string {
  const digitosNuevos = soloDigitos(textoNuevo).slice(0, MAX_DIGITOS_TELEFONO);
  const digitosAnteriores = soloDigitos(textoAnterior);

  const borroSoloUnSeparador =
    textoNuevo.length < textoAnterior.length && digitosNuevos === digitosAnteriores;

  return borroSoloUnSeparador ? digitosNuevos.slice(0, -1) : digitosNuevos;
}
