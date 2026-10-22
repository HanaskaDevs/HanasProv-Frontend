# Cómo compilar el APK de HanasProv

Este proyecto usa **Capacitor 7** para envolver el frontend (React + Vite) en
una app Android nativa que carga la web empaquetada dentro del APK.

## 1. Requisitos en el servidor/máquina donde se compila

- **Node.js >= 20.0.0** + npm (el servidor ya tiene 20.20.2, funciona bien
  con Capacitor 7.x — **no actualizar a Capacitor 8.x**, esa versión exige
  Node >= 22 y rompería el proyecto en este servidor)
- **JDK 17** (lo que pide Gradle actual)
- **Android SDK** (Command Line Tools es suficiente, no hace falta Android
  Studio completo si compilas por consola)
  - Variable de entorno `ANDROID_HOME` o `ANDROID_SDK_ROOT` apuntando al SDK
  - Necesitas al menos: `platform-tools`, `platforms;android-35`,
    `build-tools;35.0.0` (o la versión que pida Gradle al sincronizar)

> Si prefieres no instalar el SDK en el servidor RedHat, la alternativa más
> simple es: hacer `npm run build` + `npx cap sync android` en el servidor,
> bajar la carpeta `android/` a tu Windows, y compilar ahí con Android Studio
> (que te instala el SDK automáticamente con un asistente gráfico).

## 2. Flujo normal cuando cambia el frontend: publicar, sin APK nuevo

Cada vez que se modifique código en `src/`, con un usuario que tenga Node
(como root no hay Node en el servidor):

```bash
cd /var/www/hk-proveedores/HanasProv-Frontend
npm run publicar:app
```

Eso es todo: los celulares se actualizan solos. Qué hace por dentro
(`scripts/app/publicar.sh`):

1. Compila el frontend para la app en `dist-apk/` con una versión nueva
   (`1.AAAAMMDD.HHMMSS`).
2. Lo empaqueta en un zip con su SHA-256 y lo deja en
   `/var/www/hk-proveedores/app-updates/paquetes/`, junto con `latest.json`.
   nginx los sirve en `https://portal-proveedores.hanaska.com/app-updates/`
   (bloque `location ^~ /app-updates/` en `hanaska-frontend-5174.conf`).
3. Hace `cap sync android`, para que el próximo APK ya salga con esta versión.

Del lado del celular (`src/shared/utils/actualizacionApp.ts`, plugin
`@capgo/capacitor-updater`): la app consulta `latest.json` al abrir y al
volver a primer plano, baja el zip en segundo plano y lo aplica **al abrirla
desde cero** o **al volver después de 10+ minutos afuera**. Nunca en medio de
algo (por ejemplo, mientras el proveedor elige un archivo para subir). Si un
paquete nuevo no arranca, el plugin vuelve solo al anterior y esa versión no
se vuelve a bajar.

**No usar `npm run build` para la app**: ese genera `dist/`, que es lo que
nginx sirve como portal web, y lleva `VITE_API_URL=/api` (relativo). Dentro
del celular `/api` apunta al propio celular y la app no encuentra el
backend. La app se compila con `scripts/app/build-apk.sh` (lo usa
`publicar:app`), que pone la URL absoluta de la API y la de actualizaciones.

### Cuándo SÍ hace falta un APK nuevo

Solo cuando cambia algo nativo: un plugin de Capacitor nuevo, permisos,
ícono, `capacitor.config.ts`, la firma o la versión de Android. En ese caso:

1. Subir `versionCode` (y `versionName`) en `android/app/build.gradle`.
2. Publicar diciendo qué APK hace falta, para que los APK viejos no bajen un
   frontend que necesita lo nativo nuevo:
   `VERSION_CODE_MINIMO=<el versionCode nuevo> npm run publicar:app`
3. Empaquetar y compilar el APK (abajo) y repartirlo.

## 3. Compilar el APK (en Windows)

### Empaquetar en el servidor

```bash
cd /var/www/hk-proveedores/HanasProv-Frontend
npm run publicar:app          # o al menos: npm run build:apk && npx cap sync android
bash scripts/app/empaquetar-android.sh /root/hk-android.zip
```

El zip lleva `android/` y, a su lado, las librerías nativas de
`node_modules/@capacitor/...` y `node_modules/@capgo/capacitor-updater`,
porque `capacitor.settings.gradle` las busca en `../node_modules/...`: si solo
se copia `android/`, Gradle no sincroniza.

En Windows: `scp root@10.100.60.74:~/hk-android.zip .`, descomprimir y en
Android Studio abrir la subcarpeta **`android`**.

### Firma de release

Los APK que se reparten van **firmados con la clave de release**, no en
debug: Android solo instala una versión encima de la otra si las dos tienen
la misma firma, y la de debug cambia según la PC donde se compile.

La clave está en el servidor en `/root/hanasprov-firma/` (solo root):
`hanasprov-release.p12` + `keystore.properties` (contraseñas). **Respaldarla
fuera del servidor**: si se pierde, ningún APK nuevo se podrá instalar encima
de los que ya tienen los usuarios.

En Windows va una sola vez, en `C:\Users\<usuario>\hanasprov-firma\`:

```
scp -r root@10.100.60.74:/root/hanasprov-firma $env:USERPROFILE\
```

`android/app/build.gradle` la toma de ahí sola (o de la carpeta que diga la
variable de entorno `HANASPROV_FIRMA`). Nunca va dentro del repo ni del zip.

### Generar el APK firmado

En Android Studio: `Build > Select Build Variant…` → `release`, y después
`Build > Build Bundle(s) / APK(s) > Build APK(s)`. O por consola, en la
carpeta `android`:

```
.\gradlew.bat assembleRelease
```

El APK queda en `android/app/build/outputs/apk/release/app-release.apk`.

Un celular que tenga instalado un APK de **debug** tiene que desinstalarlo
una vez antes de instalar el de release (firmas distintas).

Para probar conectado por USB sigue sirviendo Run ▶️ (debug), pero ese APK
no es el que se reparte.

## 4. Configurar hacia dónde apunta la app

La URL de la API de la app y la de actualizaciones están en
`scripts/app/build-apk.sh` (hoy `https://portal-proveedores.hanaska.com/api`
y `.../app-updates/latest.json`); para cambiarlas, cambiarlas ahí y publicar.

La app se sirve desde el origen `https://app.portal-proveedores.hanaska.com`
(`server.hostname` en `capacitor.config.ts`) y no desde `https://localhost`,
el por defecto de Capacitor. Ese nombre no existe en DNS: Capacitor lo atiende
dentro del celular. Por eso:

- Ese origen tiene que estar permitido en el CORS del backend
  (`CORS_ORIGENES_PERMITIDOS`).
- El certificado del dominio tiene que entregarse con la cadena completa
  (certificado + intermediario GoGetSSL RSA DV CA). Las PCs completan la
  cadena solas, Android no, y la app falla al conectar. Mientras el servidor
  no la entregue completa, la app trae ese intermediario en
  `app/src/main/res/raw/gogetssl_rsa_dv_ca.pem` (declarado en
  `network_security_config.xml`, vence 2028-09-05).
- El captcha del login (Turnstile) solo entrega token en los dominios del
  widget en Cloudflare y sus subdominios. Con `localhost` no daba token y el
  login decía "No pudimos completar la verificación de seguridad"; por eso la
  app corre como subdominio de `portal-proveedores.hanaska.com`.

## 5. Próximos pasos (cuando se necesiten)

- Cámara para subir documentos/fotos → `@capacitor/camera`
- Geolocalización (ya usan Leaflet en la web) → `@capacitor/geolocation`
- Notificaciones push → `@capacitor/push-notifications` + proyecto en
  Firebase Cloud Messaging
- Ícono y splash screen personalizados → `@capacitor/assets`
- Subida a Play Store, si se quiere que también el APK se actualice solo
