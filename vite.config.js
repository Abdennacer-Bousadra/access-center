import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Content-Security-Policy applied at build time only.
// Injected as a <meta> into the built index.html so `vite dev` keeps working
// (the Vite/React Refresh dev preamble relies on inline scripts) while
// production output is hardened.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
  "img-src 'self' data: blob: https://images.unsplash.com",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  'upgrade-insecure-requests',
].join('; ')

const CSP_META = `<meta http-equiv="Content-Security-Policy" content="${CSP}" />\n    <meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin" />`

function injectSecurityHeaders() {
  return {
    name: 'inject-security-headers',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
        `<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    ${CSP_META}`
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), injectSecurityHeaders()],
  server: {
    // Private course videos are streamed by Express only. Never let the dev
    // server watch or serve VIDEO_DIR (it may contain large locked files).
    watch: {
      ignored: ['**/storage/**'],
    },
    fs: {
      deny: ['**/storage/**'],
    },
    proxy: {
      // Forward API calls to the Express server during development.
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})