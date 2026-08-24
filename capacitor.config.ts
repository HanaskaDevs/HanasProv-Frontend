import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hanaska.hanasprov',
  appName: 'HK Proveedores',
  webDir: 'dist',
  server: {
    // Por defecto Capacitor sirve la app bajo el origen "https://localhost".
    // Como el backend todavía no tiene HTTPS (corre en http://10.100.60.170:8002),
    // cualquier petición desde esa página "https" hacia un endpoint "http" se
    // bloquea como "Mixed Content" -> la petición nunca sale del celular ni
    // llega a la red, mucho menos al servidor (por eso no aparecía nada en
    // los logs de `php artisan serve`, ni siquiera un preflight OPTIONS).
    //
    // Sirviendo la app también por "http://localhost" (mismo esquema que el
    // backend), el navegador ya no lo trata como contenido mixto -> la
    // petición sí sale a la red.
    //
    // IMPORTANTE: cuando el backend tenga dominio con HTTPS real, quitar
    // este bloque 'server' por completo (volver al 'https' por defecto de
    // Capacitor), porque ahí sí conviene y corresponde usar HTTPS de punta
    // a punta.
    androidScheme: 'http',
  },
};

export default config;
