import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Served from https://<user>.github.io/Vehicle_Maintenance/ on GitHub Pages;
// stays at '/' for local dev so `npm run dev` is unaffected.
const REPO_BASE = '/Vehicle_Maintenance/'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => {
  const base = command === 'build' || isPreview ? REPO_BASE : '/'

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg'],
        manifest: {
          name: 'Motorcycle Care',
          short_name: 'Motorcycle Care',
          description: 'Personal motorcycle maintenance management, stored on this device.',
          start_url: base,
          scope: base,
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#f4f6f7',
          theme_color: '#0f6266',
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
