type ManejadorAtras = () => void;

/**
 * Pila de "qué hacer si tocan atrás ahora mismo", de más reciente a más
 * viejo. La usan useBackHandler() (pasos internos de una página, ver
 * AuditoriasPage/CalificacionRecepcionesPage) y Modal.tsx (cualquier
 * modal abierto se registra solo).
 *
 * Por qué hace falta esto y no alcanza con navegar por URL: varios flujos
 * (elegir tipo -> elegir proveedor -> calificar) NO cambian de ruta, son
 * solo estado de React dentro del mismo componente. El botón físico
 * "atrás" de Android, sin esto, solo sabe saltar entre páginas de verdad
 * -> se saltaba esos pasos intermedios y mandaba a la página anterior a
 * toda la pantalla, no al paso anterior dentro de ella (reportado
 * probando Calidad: de "calificar" volvía a Auditorías en vez de volver a
 * "elegir proveedor").
 */
const pila: ManejadorAtras[] = [];

export function apilarAtras(manejador: ManejadorAtras) {
  pila.push(manejador);
}

export function desapilarAtras(manejador: ManejadorAtras) {
  const indice = pila.lastIndexOf(manejador);
  if (indice !== -1) pila.splice(indice, 1);
}

/** true si alguien atendió el "atrás" (no hace falta navegar de página). */
export function atenderAtras(): boolean {
  const tope = pila[pila.length - 1];
  if (!tope) return false;
  tope();
  return true;
}
