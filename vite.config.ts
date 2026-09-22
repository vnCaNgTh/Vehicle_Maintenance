import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Served from https://<user>.github.io/Vehicle_Maintenance/ on GitHub Pages;
// stays at '/' for local dev so `npm run dev` is unaffected.
const REPO_BASE = '/Vehicle_Maintenance/'

const packageJsonPath = fileURLToPath(new URL('./package.json', import.meta.url))
const appVersion = (JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as { version: string }).version

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => {
  const base = command === 'build' || isPreview ? REPO_BASE : '/'

  return {
    base,
    // Exposed for the M5 backup manifest (see src/features/backup).
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg'],
        manifest: {
          name: 'Vehicles Care',
          short_name: 'Vehicles Care',
          description: 'Personal vehicle maintenance management, stored on this device.',
          start_url: base,
          scope: base,
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#f4f6f7',
          theme_color: '#0d3b66',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        },
      }),
    ],
  }
})

