import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { CapacitorUpdater, type BundleInfo } from '@capgo/capacitor-updater';

/**
 * Actualizaciones de la app Android SIN reinstalar el APK.
 *
 * El APK trae adentro una copia del frontend (dist-apk). Cada vez que se
 * corre `npm run publicar:app` en el servidor, se publica un zip nuevo del
 * frontend en https://portal-proveedores.hanaska.com/app-updates/ junto con
 * un latest.json que dice cuál es la última versión. La app lo consulta, baja
 * el zip en segundo plano y lo aplica en un momento seguro.
 *
 * CUÁNDO SE APLICA, y por qué no "apenas se descarga":
 *   - Al abrir la app desde cero (si ya estaba descargada de antes).
 *   - Al volver a la app después de 10+ minutos afuera.
 * Aplicar recarga la app entera. Si se aplicara al pasar a segundo plano (lo
 * que hace el plugin por defecto), se recargaría mientras el proveedor elige
 * un archivo en la galería para subir un documento, y perdería lo que estaba
 * llenando.
 *
 * Solo cambia la parte web. Lo nativo (permisos, plugins, ícono) sigue
 * necesitando un APK nuevo: por eso el latest.json trae `versionCodeMinimo`,
 * y un APK más viejo que eso no baja la actualización (podría depender de un
 * plugin que ese APK no tiene).
 */

interface Manifiesto {
  version: string;
  url: string;
  checksum: string;
  versionCodeMinimo: number;
}

/** La versión de ESTE build; la pone scripts/app/build-apk.sh. */
const VERSION_ACTUAL: string = import.meta.env.VITE_APP_VERSION ?? '0.0.0';
const URL_MANIFIESTO: string | undefined = import.meta.env.VITE_APP_UPDATES_URL;

const AUSENCIA_PARA_APLICAR = 10 * 60_000;
/** Al volver a la app no se pregunta más de una vez cada 15 min. */
const ESPERA_ENTRE_CONSULTAS = 15 * 60_000;

let ultimaConsulta = 0;
let consultando = false;
let pausadaDesde: number | null = null;

/** Compara "1.20261021.110530" número por número: >0 si a es más nueva. */
function compararVersiones(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diferencia = (pa[i] || 0) - (pb[i] || 0);
    if (diferencia !== 0) return diferencia;
  }
  return 0;
}

/** El paquete ya descargado más nuevo que lo que está corriendo, si hay. */
async function paqueteListo(): Promise<BundleInfo | null> {
  const { bundles } = await CapacitorUpdater.list();
  const listos = bundles.filter(
    (b) =>
      b.id !== 'builtin' &&
      (b.status === 'success' || b.status === 'pending') &&
      compararVersiones(b.version, VERSION_ACTUAL) > 0,
  );
  listos.sort((a, b) => compararVersiones(b.version, a.version));
  return listos[0] ?? null;
}

async function buscarActualizacion() {
  if (!URL_MANIFIESTO || consultando) return;
  consultando = true;
  ultimaConsulta = Date.now();
  try {
    // `v` no lo usa el servidor: queda en el log de nginx y sirve para ver
    // qué versión tiene cada celular (grep app-updates en
    // hanaska-frontend.access.log).
    const respuesta = await fetch(
      `${URL_MANIFIESTO}?t=${Date.now()}&v=${encodeURIComponent(VERSION_ACTUAL)}`,
      { cache: 'no-store' },
    );
    if (!respuesta.ok) return;
    const manifiesto = (await respuesta.json()) as Manifiesto;
    if (!manifiesto.version || !manifiesto.url || !manifiesto.checksum) return;
    if (compararVersiones(manifiesto.version, VERSION_ACTUAL) <= 0) return;

    const { build } = await CapacitorApp.getInfo();
    if (Number(build) < (manifiesto.versionCodeMinimo || 0)) return;

    const { bundles } = await CapacitorUpdater.list();
    const yaBajado = bundles.find((b) => b.version === manifiesto.version);
    // Una versión que ya falló (no arrancó y el plugin volvió a la anterior)
    // no se vuelve a bajar: se espera a que publiquen otra.
    if (yaBajado && yaBajado.status !== 'deleted') return;

    await CapacitorUpdater.download({
      url: manifiesto.url,
      version: manifiesto.version,
      checksum: manifiesto.checksum,
    });
  } catch (error) {
    // Sin conexión o servidor caído: se reintenta la próxima vez.
    console.warn('No se pudo buscar actualización de la app', error);
  } finally {
    consultando = false;
  }
}

async function aplicarSiHayLista() {
  const paquete = await paqueteListo();
  // set() recarga la app con el paquete nuevo: no se ejecuta nada después.
  if (paquete) await CapacitorUpdater.set({ id: paquete.id });
}

export function iniciarActualizacionesApp() {
  if (!Capacitor.isNativePlatform()) return;

  // Primero que nada: si este paquete no avisa que arrancó en 10 s, el
  // plugin asume que vino roto y vuelve al anterior.
  void CapacitorUpdater.notifyAppReady();

  void (async () => {
    try {
      await aplicarSiHayLista();
    } catch (error) {
      console.warn('No se pudo aplicar la actualización de la app', error);
    }
    await buscarActualizacion();
  })();

  void CapacitorApp.addListener('pause', () => {
    pausadaDesde = Date.now();
  });

  void CapacitorApp.addListener('resume', () => {
    const ausencia = pausadaDesde === null ? 0 : Date.now() - pausadaDesde;
    pausadaDesde = null;
    void (async () => {
      try {
        if (ausencia >= AUSENCIA_PARA_APLICAR) await aplicarSiHayLista();
      } catch (error) {
        console.warn('No se pudo aplicar la actualización de la app', error);
      }
      if (Date.now() - ultimaConsulta >= ESPERA_ENTRE_CONSULTAS) await buscarActualizacion();
    })();
  });
}
