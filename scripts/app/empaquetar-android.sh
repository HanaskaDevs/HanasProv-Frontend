#!/usr/bin/env bash
# Arma el zip para compilar el APK en Windows con Android Studio:
# android/ + las librerías de Capacitor que capacitor.settings.gradle busca en
# ../node_modules (si solo se lleva android/, Gradle no sincroniza).
#
#   bash scripts/app/empaquetar-android.sh [destino.zip]   (por defecto ~/hk-android.zip)
set -euo pipefail

FRONT="$(cd "$(dirname "$0")/../.." && pwd)"
DESTINO="${1:-$HOME/hk-android.zip}"

cd "$FRONT"
rm -f "$DESTINO"
zip -qr "$DESTINO" android \
  node_modules/@capacitor/android node_modules/@capacitor/app node_modules/@capgo/capacitor-updater \
  -x 'android/build/*' 'android/app/build/*' 'android/.gradle/*' 'android/.idea/*' \
     'android/local.properties' 'android/keystore.properties' '*/capacitor/build/*' \
     'node_modules/@capgo/capacitor-updater/ios/*'
echo "Listo: $DESTINO"
