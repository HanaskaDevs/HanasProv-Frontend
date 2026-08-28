import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { atenderAtras } from '../utils/pilaAtras';

/**
 * Sin esto, el botón físico "atrás" de Android sale directo de la app
 * (Capacitor, si nadie escucha el evento 'backButton', hace lo mismo que
 * hacía por defecto la Activity nativa: si no hay más historial en el
 * WebView, cierra/minimiza la actividad). Es justo lo que reportó el
 * usuario probando con Calidad: "le doy para atrás y me manda al menú del
 * teléfono", en vez de volver a la pantalla anterior DENTRO de la app.
 *
 * Con este listener, en orden:
 * 1. Si hay un modal abierto o un paso interno registrado (ver
 *    useBackHandler y Modal.tsx) -> se atiende ESO primero (cerrar el
 *    modal, o volver al paso anterior del wizard) y nada más. Sin este
 *    paso, "atrás" se saltaba pasos que no son una ruta propia (elegir
 *    tipo -> elegir proveedor -> calificar, dentro de la misma URL) y
 *    mandaba directo a la página anterior de verdad.
 * 2. Si no, y hay una pantalla anterior dentro de la app, navega ahí.
 * 3. Si ya está en una pantalla "raíz" (login o el panel principal), en
 *    vez de cerrar la app la MINIMIZA (la manda a segundo plano, como
 *    hacen la gran mayoría de apps Android).
 */
const RUTAS_RAIZ = new Set(['/panel', '/login', '/']);

export function useAndroidBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listenerPromise = CapacitorApp.addListener('backButton', () => {
      if (atenderAtras()) return;

      if (RUTAS_RAIZ.has(location.pathname)) {
        CapacitorApp.minimizeApp();
      } else {
        navigate(-1);
      }
    });

    return () => {
      listenerPromise.then((listener) => listener.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);
}
