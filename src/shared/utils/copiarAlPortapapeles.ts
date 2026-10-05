/**
 * Copia texto al portapapeles, también fuera de HTTPS.
 *
 * POR QUÉ HAY DOS CAMINOS: navigator.clipboard solo existe en un "contexto
 * seguro" (HTTPS o localhost). El portal de desarrollo corre en
 * http://10.100.60.170:5173 y producción todavía no tiene HTTPS: ahí
 * navigator.clipboard es undefined y un "Copiar" que dependa solo de eso
 * no hace NADA, sin ningún error visible. El respaldo es el método viejo
 * (un textarea temporal + execCommand), que funciona en cualquier origen.
 *
 * @returns true si se copió.
 */
export async function copiarAlPortapapeles(texto: string): Promise<boolean> {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      // Permiso denegado u otro fallo: se intenta el camino viejo.
    }
  }

  const area = document.createElement('textarea');
  area.value = texto;
  // Fuera de la vista y sin mover el scroll de la página.
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.top = '-1000px';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();

  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(area);
  }
}
