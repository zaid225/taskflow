import { fileURLToPath } from 'node:url'
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, isPreview }) => ({
  plugins: [
    react(),
    tailwindcss(),
    // Local development uses the verified-TLS URL in .dev.vars.
    cloudflare({ config: command === 'serve' && !isPreview ? { hyperdrive: [] } : undefined }),
  ],
  server: { host: '127.0.0.1', port: 8787, strictPort: true },
  optimizeDeps: {
    include: ['@dnd-kit/react', '@dnd-kit/react/sortable'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))
