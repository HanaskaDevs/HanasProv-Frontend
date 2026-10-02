import type { BannerInformativo } from '../api/bannerApi';
import { idDeSesionActual } from '../../../shared/utils/inicioDeSesion';

const CLAVE_CERRADO = 'banner-informativo-cerrado';

/**
 * La "marca" de lo que habría que mostrar ahora mismo. El banner se
 * muestra cuando la marca guardada —lo último que el usuario cerró— no
 * coincide con ésta.
 *
 * Las dos frecuencias salen de la misma comparación, y por eso no hay dos
 * caminos distintos que mantener:
 *
 *  - 'una_vez': la marca es la VERSIÓN del banner. Cerrarlo vale para
 *    siempre; lo único que lo trae de vuelta es que Sistemas lo cambie,
 *    porque ahí la versión es otra.
 *
 *  - 'siempre': la marca lleva además el id del último inicio de sesión.
 *    Cerrarlo vale hasta que la persona vuelva a entrar. No alcanza con
 *    recargar ni con abrir otra pestaña: ese id solo cambia al pasar por
 *    login() (ver shared/utils/inicioDeSesion).
 */
export function marcaActual(banner: BannerInformativo): string {
  const version = banner.version ?? 'sin-version';

  return banner.frecuencia === 'siempre'
    ? `${version}|${idDeSesionActual() ?? 'sin-sesion'}`
    : version;
}

/**
 * Todo lo que toca el almacenamiento va dentro de try/catch: en una
 * ventana privada, o con el almacenamiento bloqueado, leer o escribir
 * lanza. Un banner que no se recuerda es molesto; una pantalla en blanco
 * es otra cosa.
 */
export function marcaCerrada(): string | null {
  try {
    return localStorage.getItem(CLAVE_CERRADO);
  } catch {
    return null;
  }
}

export function recordarCierre(marca: string): void {
  try {
    localStorage.setItem(CLAVE_CERRADO, marca);
  } catch {
    // Sin almacenamiento, el banner volverá a aparecer. Es el mal menor.
  }
}

/**
 * ¿Hay algo que mostrar de verdad?
 *
 * No alcanza con que el banner esté encendido. Si se borra la última
 * imagen y no quedan título ni mensaje, el modal se dibujaba igual: una
 * tarjeta vacía sobre la pantalla oscurecida, sin nada adentro. Parecía
 * la página colgada, y es justo lo que pasaba al borrar una pieza desde
 * Configuraciones.
 */
export function tieneContenido(banner: BannerInformativo): boolean {
  const hayPiezas = banner.piezas.some((pieza) => pieza.url_media);
  const hayTexto = Boolean(banner.titulo?.trim() || banner.mensaje?.trim());

  return hayPiezas || hayTexto;
}
