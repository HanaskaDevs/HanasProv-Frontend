import { useEffect, useRef } from 'react';
import { apilarAtras, desapilarAtras } from '../utils/pilaAtras';

/**
 * Registra `manejador` como "qué hacer si tocan atrás ahora" mientras esté
 * activo (no sea null). Pensado para pasos internos que no son una ruta
 * propia: en AuditoriasPage, por ejemplo, se usa así:
 *
 *   useBackHandler(auditoria ? cambiarProveedor : idTipoElegido ? cambiarTipo : null);
 *
 * Solo se re-registra en la pila cuando cambia si HAY manejador o no (de
 * null a función o viceversa) -> no en cada render, aunque la función en
 * sí sea una nueva referencia cada vez (JSX inline). Para eso se guarda
 * en un ref y siempre se llama a la versión más fresca.
 */
export function useBackHandler(manejador: (() => void) | null) {
  const manejadorRef = useRef(manejador);

  useEffect(() => {
    manejadorRef.current = manejador;
  });

  useEffect(() => {
    if (!manejador) return;

    const envoltorio = () => manejadorRef.current?.();
    apilarAtras(envoltorio);

    return () => desapilarAtras(envoltorio);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!manejador]);
}
