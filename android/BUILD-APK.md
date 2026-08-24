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

## 2. Flujo normal cuando cambia el frontend

Cada vez que se modifique código en `src/`:

```bash
# 1. Reconstruir el build web
npm run build

# 2. Copiar el build nuevo dentro del proyecto Android
npx cap sync android
```

`cap sync` copia lo último de `dist/` hacia
`android/app/src/main/assets/public`. Sin este paso, el APK sigue
mostrando la versión vieja de la web aunque hayas hecho `npm run build`.

## 3. Compilar el APK

### Opción A: por línea de comandos (sin Android Studio)

```bash
cd android
./gradlew assembleDebug      # genera un APK de pruebas (sin firmar)
```

El APK queda en:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

Para una versión "release" (firmada, la que subirías a Play Store o
distribuirías formalmente) hace falta generar un keystore y firmar el
build — lo vemos cuando lleguemos a esa etapa.

### Opción B: con Android Studio (más visual, recomendado en Windows)

1. Abrir Android Studio → "Open" → seleccionar la carpeta `android/`
2. Dejar que sincronice Gradle (primera vez puede tardar, descarga cosas)
3. Conectar un celular por USB (modo desarrollador + depuración USB activada)
   o usar un emulador
4. Run ▶️ para probar, o `Build > Build Bundle(s) / APK(s) > Build APK(s)`
   para generar el archivo instalable

## 4. Configurar hacia dónde apunta la app

El frontend usa `VITE_API_URL` (ver `.env`). El build que se empaqueta en el
APK usa el valor que tenga `.env` **en el momento de correr `npm run build`**.

- Mientras no haya dominio HTTPS: puedes apuntar a la IP/dominio de staging
  en la red (ej. `http://192.168.1.50:8000/api` o `http://proveedores.local/api`).
  Revisa `android/app/src/main/res/xml/network_security_config.xml`: ahí
  debes agregar ese dominio/IP a la lista de excepciones para que Android
  permita tráfico HTTP (por defecto Android bloquea HTTP en apps modernas).
- Cuando exista el dominio productivo con HTTPS: actualizar `.env` con esa
  URL, quitar las excepciones de `network_security_config.xml` y quitar
  `android:usesCleartextTraffic="true"` del `AndroidManifest.xml` para forzar
  HTTPS en toda la app.

## 5. Próximos pasos (cuando se necesiten)

- Cámara para subir documentos/fotos → `@capacitor/camera`
- Geolocalización (ya usan Leaflet en la web) → `@capacitor/geolocation`
- Notificaciones push → `@capacitor/push-notifications` + proyecto en
  Firebase Cloud Messaging
- Ícono y splash screen personalizados → `@capacitor/assets`
- Firma de release + subida a Play Store (o distribución interna del APK)
