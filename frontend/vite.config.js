import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'fingery.',
        short_name: 'fingery',
        description: 'Minimalist Speed Typing Test',
        theme_color: '#4f8cff',
        background_color: '#0f0f23',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/fingery.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/fingery.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
