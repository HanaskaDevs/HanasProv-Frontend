import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hanaska.hanasprov',
  appName: 'HK Proveedores',
  // El APK sale de 'dist-apk' (npm run build:apk) y NO de 'dist': nginx sirve
  // el portal web directo desde 'dist', y el APK necesita una URL absoluta de
  // la API ('/api' relativo dentro del celular apunta al propio celular).
  webDir: 'dist-apk',
  server: {
    // La app se sirve como https://app.portal-proveedores.hanaska.com y no
    // como https://localhost (el por defecto de Capacitor): el captcha del
    // login (Cloudflare Turnstile) solo entrega token en los dominios
    // registrados en su widget y sus subdominios, y con 'localhost' no daba
    // token -> el login respondía "No pudimos completar la verificación de
    // seguridad". Ese nombre no necesita existir en DNS: Capacitor lo atiende
    // dentro del celular. Tiene que estar en CORS_ORIGENES_PERMITIDOS del
    // backend.
    hostname: 'app.portal-proveedores.hanaska.com',
  },
  plugins: {
    // Actualizaciones de la parte web sin reinstalar el APK. Cuándo se busca
    // y se aplica lo decide src/shared/utils/actualizacionApp.ts, no el
    // plugin; los paquetes salen de nuestro servidor (npm run publicar:app).
    CapacitorUpdater: {
      autoUpdate: false,
      // Por defecto el plugin manda estadísticas a los servidores de Capgo.
      statsUrl: '',
      // Una versión que no arrancó queda marcada como fallida en vez de
      // borrarse: si se borrara, la app la volvería a bajar en cada consulta.
      autoDeleteFailed: false,
    },
  },
};

export default config;
