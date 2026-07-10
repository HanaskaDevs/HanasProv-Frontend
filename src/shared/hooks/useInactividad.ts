import { useEffect, useRef } from 'react';

const EVENTOS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'] as const;

export function useInactividad(minutos: number, alExpirar: () => void) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function reiniciar() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(alExpirar, minutos * 60 * 1000);
    }

    reiniciar();
    EVENTOS.forEach((evento) => window.addEventListener(evento, reiniciar));

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      EVENTOS.forEach((evento) => window.removeEventListener(evento, reiniciar));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minutos]);
}