import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  plugins: [
    react(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024
    })
  ],
  define: {
    'process.env': {}
  },
  build: {
    target: 'es2018',
    minify: 'terser',
    assetsInlineLimit: 4096,
    terserOptions: {
      compress: {
        drop_console: ['log', 'info', 'debug'],
        drop_debugger: true,
        passes: 2
      },
      format: {
        comments: false
      }
    },
    cssCodeSplit: true,
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Large non-React vendors — safe to split independently.
            if (id.includes('@supabase')) {
              return 'supabase-vendor'
            }
            if (id.includes('three')) {
              return 'three-vendor'
            }
            if (id.includes('swiper')) {
              return 'swiper-vendor'
            }

            // Keep the entire React ecosystem in one chunk. Splitting react-router,
            // framer-motion, react-hot-toast, etc. into separate chunks created
            // circular imports (react-vendor <-> react-utils <-> vendor-misc) and
            // runtime "Cannot read properties of undefined (reading 'memo')" errors.
            const isReactEcosystem =
              id.includes('/react-dom/') ||
              id.includes('/react/') ||
              id.includes('/react/index') ||
              id.includes('/react/jsx-runtime') ||
              id.includes('/scheduler/') ||
              id.includes('react-router') ||
              id.includes('@remix-run/router') ||
              id.includes('framer-motion') ||
              id.includes('react-hot-toast') ||
              id.includes('goober') ||
              id.includes('react-intersection-observer') ||
              id.includes('react-countup') ||
              id.includes('countup.js') ||
              id.includes('react-masonry-css') ||
              id.includes('yet-another-react-lightbox')

            if (isReactEcosystem) {
              return 'react-vendor'
            }

            return 'vendor-misc'
          }
          // Shared hooks — must not live only inside component-Home-core (SectionMedia
          // in component-common imports these; Home-core → About → common → Home-core TDZ).
          if (id.includes('/hooks/useHeroVideoMode')) {
            return 'hooks-hero-video'
          }
          // Home hero data/libs — keep out of About-sections to avoid cross-chunk init bugs
          if (
            id.includes('/content/') ||
            id.includes('/data/heroSlides') ||
            id.includes('/data/homeImageRegistry') ||
            id.includes('/data/contactHero') ||
            id.includes('/data/localAssets') ||
            id.includes('/lib/mediaCache') ||
            id.includes('/lib/idle') ||
            id.includes('/lib/unsplash') ||
            id.includes('/lib/pexels') ||
            id.includes('/lib/storageUrl')
          ) {
            return 'shared-home-data'
          }
          // Page chunks
          if (id.includes('/pages/')) {
            const pageName = id.split('/pages/')[1].split('/')[0]
            if (pageName === 'admin') {
              return 'admin-pages'
            }
            return `page-${pageName}`
          }
          // Component chunks
          if (id.includes('/components/')) {
            if (id.includes('/components/Layout/ChatAssistant')) {
              return 'chat-assistant'
            }
            if (id.includes('/components/admin/ThreeJSBackground')) {
              return 'three-background'
            }
            // Home: keep hero shell eager; lazy sections get their own async chunks
            if (id.includes('/components/Home/')) {
              if (/\/components\/Home\/(Hero|HeroSlider|HeroPartnersCarousel)\./.test(id)) {
                return 'component-Home-core'
              }
              if (/\/components\/Home\/(About|CeoVisionMission)\./.test(id)) {
                return 'component-About-sections'
              }
              const homeFile = id.split('/components/Home/')[1].split('.')[0]
              return `home-${homeFile}`
            }
            const componentType = id.split('/components/')[1].split('/')[0]
            return `component-${componentType}`
          }
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return 'assets/images/[name]-[hash][extname]'
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return 'assets/fonts/[name]-[hash][extname]'
          }
          return 'assets/[ext]/[name]-[hash][extname]'
        }
      }
    },
    chunkSizeWarningLimit: 800,
    reportCompressedSize: true,
    modulePreload: {
      resolveDependencies: (_filename, deps) =>
        deps.filter(
          (dep) =>
            !dep.includes('three-vendor') &&
            !dep.includes('three-background') &&
            !dep.includes('swiper-vendor') &&
            !dep.includes('supabase-vendor') &&
            !dep.includes('chat-assistant') &&
            !dep.includes('admin-pages') &&
            !dep.includes('component-About-sections') &&
            !dep.startsWith('home-')
        )
    }
  },
  server: {
    port: 5173,
    strictPort: false,
    open: false,
    hmr: {
      port: 5173,
      clientPort: 5173
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'scheduler'],
    exclude: ['framer-motion', 'swiper', 'three']
  },
  esbuild: {
    legalComments: 'none',
    treeShaking: true
  }
})
