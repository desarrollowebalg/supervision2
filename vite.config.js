/**
 * Vite configuration file for building the project.
 * This configuration is used to bundle the JavaScript files and assets for the project.
 * It specifies the input files, output directory, and other build options.
 */
// nueva forma de configuracion
import { defineConfig } from 'vite'
import { resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  root: '.',
  publicDir: 'assets',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['images/**/*', 'sounds/**/*'],
      manifest: {
        name: 'BDDynamics - Supervisiín y control de incidencas',
        short_name: 'BD Dynamics',
        description: 'Plataforma de gestión y control de incidencias.',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/public/images/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/public/images/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/public/images/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/public/images/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/public/images/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/public/images/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/public/images/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/public/images/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/public/images/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/public/images/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          {
            src: '/public/images/fondos/hero.png',
            sizes: '1440x390',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Vista principal en escritorio'
          },
          {
            src: '/public/images/404.jpg',
            sizes: '570x380',
            type: 'image/jpeg',
            label: 'Vista principal en móvil'
          }
        ]
      },
      workbox: {
        // This project is server-routed (PHP), not SPA index.html routed.
        // Prevent Workbox from hijacking navigations to index.html.
        navigateFallback: null,
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 días
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'jsdelivr-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // <== 30 días
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 120,
                maxAgeSeconds: 60 * 60 * 24 * 30 // <== 30 dias
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  build: {
    outDir: './dist',
    sourcemap: true,
    emptyOutDir: true,
    manifest: 'manifest.json',
    rollupOptions: {
      input: {
        login: resolve(__dirname, 'src/pages/login/main.js'),
        inicio: resolve(__dirname, 'src/pages/inicio/main.js'),                
      },
      output: {
        entryFileNames: 'js/[name].[hash].js',
        chunkFileNames: 'js/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          // Organizar assets por tipo
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|webp|ico)$/i.test(assetInfo.name)) {
            return 'assets/images/[name].[hash].[ext]';
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return 'assets/fonts/[name].[hash].[ext]';
          }
          if (/\.css$/i.test(assetInfo.name)) {
            return 'assets/[name].[hash].[ext]';
          }
          return 'assets/[name].[hash].[ext]';
        },
      }
    },
    // Optimización de chunks
    cssCodeSplit: true,
    // Configuración de minificación
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    }
  },
  // Optimizar dependencias
  optimizeDeps: {
    include: ['uikit', 'uikit/dist/js/uikit-icons']
  }
})
