/**
 * Lleva al usuario hasta el primer campo obligatorio que le falta.
 *
 * EL PROBLEMA QUE RESUELVE: el botón de continuar está al pie de la
 * Ficha, y los campos que faltan pueden estar muy por encima, fuera de la
 * pantalla. Al hacer clic no pasaba NADA visible -el formulario no
 * avanzaba y no había forma de saber por qué-. Ahora la página sube hasta
 * el campo, lo enfoca y lo sacude un momento.
 *
 * POR QUÉ NO ALCANZA CON shouldFocusError DE REACT-HOOK-FORM: esa opción
 * solo actúa en handleSubmit y solo sobre campos registrados con
 * `register`, que exponen su ref. La Ficha valida por PASOS con trigger()
 * -que no enfoca nada- y sus selectores y teléfonos son componentes
 * controlados con <Controller>, sin ref que RHF pueda enfocar. Por eso se
 * busca el elemento por id en el DOM: CampoFicha, CampoFichaCombo y
 * CampoFichaTelefono usan el nombre del campo como id, así que el id es
 * el mismo nombre que aparece en los errores.
 */

/** Cuánto dura la clase de la sacudida, en ms. Debe coincidir con el CSS. */
const DURACION_SACUDIDA = 400;

export function enfocarPrimerCampoConError(
  errores: Record<string, unknown>,
  ordenDeLosCampos: readonly string[]
): boolean {
  // Se recorre en el ORDEN EN QUE SE VEN los campos, no en el orden en que
  // el objeto de errores los enumere: al usuario hay que llevarlo al
  // primero que se encuentra bajando la página, no a uno del medio.
  const primero = ordenDeLosCampos.find((campo) => errores[campo]);

  if (!primero) {
    return false;
  }

  const elemento = document.getElementById(primero);

  if (!elemento) {
    return false;
  }

  // 'center' y no 'start': deja el campo a media pantalla, con su etiqueta
  // y su mensaje de error a la vista. Con 'start' quedaba pegado al borde
  // de arriba, a veces tapado por el encabezado fijo.
  elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // preventScroll: el foco por sí solo provoca un salto instantáneo que
  // pisaría el desplazamiento suave de la línea de arriba.
  elemento.focus({ preventScroll: true });

  // closest('div'): para un input es la fila (etiqueta + campo), y para el
  // mapa es su propio envoltorio. En los dos casos sacude el bloque
  // completo y no solo el recuadro, que es lo que se nota.
  const contenedor = elemento.closest('div');

  if (contenedor) {
    // Se quita y se vuelve a poner para que la animación se repita si el
    // usuario insiste con el mismo campo vacío; si no, el navegador la
    // considera ya reproducida y no pasa nada la segunda vez.
    contenedor.classList.remove('animar-campo-faltante');
    void contenedor.offsetWidth;
    contenedor.classList.add('animar-campo-faltante');

    window.setTimeout(() => contenedor.classList.remove('animar-campo-faltante'), DURACION_SACUDIDA);
  }

  return true;
}
