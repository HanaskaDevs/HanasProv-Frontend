import { useEffect, useState } from 'react';

/**
 * Devuelve el valor recién después de que pase "demora" ms sin que
 * vuelva a cambiar -> para no disparar una búsqueda al servidor en
 * cada tecla que el usuario escribe, solo cuando hace una pausa.
 */
export default function useDebounce<T>(valor: T, demora = 400): T {
  const [valorConDemora, setValorConDemora] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setValorConDemora(valor), demora);
    return () => clearTimeout(temporizador);
  }, [valor, demora]);

  return valorConDemora;
}