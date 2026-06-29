import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
            // React core - smallest, most stable
            if (id.includes('/react/') || id.includes('/react/index') || id.includes('/react/jsx-runtime')) {
              return 'react-core'
            }
            // React DOM - larger but stable
            if (id.includes('react-dom')) {
              return 'react-dom'
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
            // Other small node_modules
            return 'vendor-misc'
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
            !dep.includes('admin-pages')
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
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['framer-motion', 'swiper', 'three']
  },
  esbuild: {
    legalComments: 'none',
    treeShaking: true
  }
})
