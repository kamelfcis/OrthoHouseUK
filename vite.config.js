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
          // Vendor chunks - split React libraries separately for better caching
          if (id.includes('node_modules')) {
            // Keep react, react-dom, and scheduler in one chunk to avoid
            // circular imports (react-dom -> scheduler in vendor-misc -> react-dom).
            if (
              id.includes('/react-dom/') ||
              id.includes('/react/') ||
              id.includes('/react/index') ||
              id.includes('/react/jsx-runtime') ||
              id.includes('/scheduler/')
            ) {
              return 'react-vendor'
            }
            // React Router - separate for better caching
            if (id.includes('react-router')) {
              return 'react-router'
            }
            // Animation library - large, can be lazy loaded
            if (id.includes('framer-motion')) {
              return 'animation-vendor'
            }
            // UI libraries
            if (id.includes('swiper')) {
              return 'swiper-vendor'
            }
            // Database client - can be lazy loaded
            if (id.includes('@supabase')) {
              return 'supabase-vendor'
            }
            // 3D library - large, lazy load if possible
            if (id.includes('three')) {
              return 'three-vendor'
            }
            // Small utility libraries - bundle together
            if (id.includes('react-hot-toast') || 
                id.includes('react-intersection-observer') || 
                id.includes('react-countup') || 
                id.includes('react-masonry-css')) {
              return 'react-utils'
            }
            if (id.includes('yet-another-react-lightbox')) {
              return 'lightbox-vendor'
            }
            // Other small node_modules
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
            !dep.includes('animation-vendor') &&
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
