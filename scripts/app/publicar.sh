#!/usr/bin/env bash
# Publica una actualización de la app Android: los celulares la bajan solos,
# sin reinstalar el APK (ver src/shared/utils/actualizacionApp.ts).
#
#   npm run publicar:app
#
# Qué hace:
#   1. Compila el frontend para la app con una versión nueva (fecha y hora).
#   2. Lo empaqueta en un zip y le calcula el SHA-256: la app rechaza el zip
#      si no coincide.
#   3. Lo deja en /var/www/hk-proveedores/app-updates/ y actualiza
#      latest.json, que nginx sirve en
#      https://portal-proveedores.hanaska.com/app-updates/.
#   4. Copia ese mismo build dentro de android/ (cap sync), para que el
#      próximo APK salga ya con esta versión.
#
# Solo publica la parte web. Si cambió algo nativo (plugin nuevo, permisos,
# ícono), hace falta además un APK nuevo con versionCode más alto; en ese caso
# publicar con VERSION_CODE_MINIMO=<ese versionCode> para que los APK viejos
# no bajen un frontend que necesita lo nativo nuevo.
set -euo pipefail
umask 002

FRONT="$(cd "$(dirname "$0")/../.." && pwd)"
DESTINO="${APP_UPDATES_DIR:-/var/www/hk-proveedores/app-updates}"
URL_PUBLICA="https://portal-proveedores.hanaska.com/app-updates"
CONSERVAR=5

if ! command -v npx >/dev/null 2>&1; then
  echo "No se encontró Node/npm. Correr con un usuario que tenga Node 20 (nvm), no como root." >&2
  exit 1
fi
if [ ! -w "$DESTINO" ]; then
  echo "No se puede escribir en $DESTINO (el usuario tiene que estar en el grupo hanasdevs)." >&2
  exit 1
fi

# Solo números y sin ceros a la izquierda: 1.AAAAMMDD.HHMMSS
VERSION="1.$(date +%Y%m%d).$((10#$(date +%H%M%S)))"
VERSION_CODE_ACTUAL="$(grep -oP 'versionCode\s+\K[0-9]+' "$FRONT/android/app/build.gradle")"
VERSION_CODE_MINIMO="${VERSION_CODE_MINIMO:-1}"

echo "==> Compilando versión $VERSION"
APP_VERSION="$VERSION" bash "$FRONT/scripts/app/build-apk.sh"

echo "==> Empaquetando"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
(cd "$FRONT/dist-apk" && zip -qr "$TMP/$VERSION.zip" .)
CHECKSUM="$(sha256sum "$TMP/$VERSION.zip" | cut -d' ' -f1)"

mkdir -p "$DESTINO/paquetes"
cp "$TMP/$VERSION.zip" "$DESTINO/paquetes/$VERSION.zip"
chmod 664 "$DESTINO/paquetes/$VERSION.zip"

# latest.json se escribe aparte y se renombra: nunca queda a medio escribir
# mientras un celular lo lee.
cat > "$DESTINO/latest.json.tmp" <<JSON
{
  "version": "$VERSION",
  "url": "$URL_PUBLICA/paquetes/$VERSION.zip",
  "checksum": "$CHECKSUM",
  "versionCodeMinimo": $VERSION_CODE_MINIMO,
  "publicado": "$(date -Iseconds)"
}
JSON
chmod 664 "$DESTINO/latest.json.tmp"
mv -f "$DESTINO/latest.json.tmp" "$DESTINO/latest.json"

# Los zips viejos ya no los pide nadie: se dejan los últimos $CONSERVAR.
ls -1t "$DESTINO"/paquetes/*.zip | tail -n +$((CONSERVAR + 1)) | xargs -r rm -f

echo "==> Copiando el build dentro de android/ para el próximo APK"
(cd "$FRONT" && npx cap sync android >/dev/null)

echo
echo "Publicada la versión $VERSION"
echo "  $URL_PUBLICA/latest.json"
echo "  APKs que la reciben: versionCode >= $VERSION_CODE_MINIMO (el actual en build.gradle es $VERSION_CODE_ACTUAL)"
