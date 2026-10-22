#!/usr/bin/env bash
# Compila el frontend PARA LA APP ANDROID en dist-apk/ (no en dist/, que es lo
# que nginx sirve como portal web). Lo usan `npm run build:apk` y
# scripts/app/publicar.sh.
#
# Variables que quedan incrustadas en el bundle:
#   VITE_API_URL          URL absoluta de la API ('/api' relativo dentro del
#                         celular apuntaría al propio celular).
#   VITE_APP_UPDATES_URL  latest.json que consulta la app para actualizarse.
#   VITE_APP_VERSION      versión de este build; publicar.sh pasa la que va a
#                         publicar. Sin ella queda 0.0.0 y la app instala la
#                         última publicada apenas arranca.
set -euo pipefail
umask 002

FRONT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$FRONT"

export VITE_API_URL="https://portal-proveedores.hanaska.com/api"
export VITE_APP_UPDATES_URL="https://portal-proveedores.hanaska.com/app-updates/latest.json"
export VITE_APP_VERSION="${APP_VERSION:-0.0.0}"

npx tsc -b
npx vite build --outDir dist-apk --emptyOutDir
