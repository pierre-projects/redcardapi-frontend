import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Production builds must know where the PDF API lives; silently falling back
 * to localhost would ship a site whose PDF downloads can never work.
 * Set ALLOW_MISSING_API_BASE=1 to build a cards-only site without PDFs.
 */
function requireApiBase(mode, env) {
  if (mode !== 'production' || env.VITE_API_BASE || process.env.ALLOW_MISSING_API_BASE) return
  throw new Error(
    'VITE_API_BASE is not set. Set it to the backend URL (see .env.example), ' +
      'or set ALLOW_MISSING_API_BASE=1 to build without PDF downloads.'
  )
}

/**
 * Strict Content-Security-Policy as a <meta> tag, so it applies on any static
 * host without server config. Only this site and the PDF API may be contacted:
 * no third-party scripts, fonts or trackers.
 */
function contentSecurityPolicy(apiBase) {
  let apiOrigin = ''
  try {
    apiOrigin = apiBase ? new URL(apiBase).origin : ''
  } catch {
    apiOrigin = ''
  }
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ''}`,
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
  ].join('; ')

  return {
    name: 'redcard-csp',
    apply: 'build',
    transformIndexHtml() {
      return [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' }]
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  requireApiBase(mode, env)

  return {
    plugins: [
      react(),
      contentSecurityPolicy(env.VITE_API_BASE),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'script-defer',
        includeAssets: ['favicon.svg', 'favicon-48.png', 'apple-touch-icon.png', 'theme-init.js'],
        manifest: {
          name: 'Red Card — Know Your Rights',
          short_name: 'Red Card',
          description: 'Know-your-rights Red Cards in 56 languages, available offline.',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: '#B91C1C',
          theme_color: '#B91C1C',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // App shell + bundled card data are precached: every card opens offline.
          globPatterns: ['**/*.{js,css,html,svg,png}'],
          globIgnores: ['card/**'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              // Script fonts download only when a card uses that script; keep them once fetched.
              urlPattern: ({ request }) => request.destination === 'font',
              handler: 'CacheFirst',
              options: {
                cacheName: 'script-fonts',
                expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
        },
      }),
    ],
    test: {
      environment: 'jsdom',
      setupFiles: ['src/test-setup.js'],
      include: ['src/**/*.test.{js,jsx}'],
    },
  }
})
