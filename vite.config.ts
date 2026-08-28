import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // host: true = escucha en TODAS las interfaces de red, no solo en
    // localhost. Sin esto, Vite queda atado a [::1] y el portal solo se
    // abre desde el propio servidor: ni la IP de la red interna ni
    // proveedores.local llegan a nada. Es lo que hacía que el botón de
    // los correos de activación no funcionara para nadie más.
    host: true,
    port: 5173,
    allowedHosts: ['proveedores.local'],
  },
})