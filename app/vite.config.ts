import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
// --- FIX #17: Only import the inspect plugin in dev; don't ship it to production ---
import { inspectAttr } from 'kimi-plugin-inspect-react'

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    // Only activate the React inspector in development builds
    mode !== 'production' && inspectAttr(),
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // --- FIX #10: Expose demo mode as a build-time constant ---
  // Set VITE_DEMO_MODE=true in .env.development to enable demo mode.
  // It compiles to `false` in production builds unconditionally.
  define: {
    __DEMO_MODE__: JSON.stringify(
      mode !== 'production' && process.env.VITE_DEMO_MODE === 'true'
    ),
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
}));
