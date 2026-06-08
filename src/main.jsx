import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import App from './App'
import './index.css'
import { prefetchBranchData } from './lib/branchDataCache'

if (typeof window !== 'undefined') {
  const warmBranchCache = () => prefetchBranchData('UK')
  if (window.requestIdleCallback) {
    window.requestIdleCallback(warmBranchCache, { timeout: 800 })
  } else {
    setTimeout(warmBranchCache, 100)
  }
}

const LazyToaster = lazy(() =>
  import('react-hot-toast').then((mod) => ({
    default: () => (
      <mod.Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#5B9B37',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#c3161b',
              secondary: '#fff',
            },
          },
        }}
      />
    ),
  }))
)

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('Global error caught:', event.error)
    event.preventDefault()
    return false
  })

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason)
    event.preventDefault()
    return false
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
      <Suspense fallback={null}>
        <LazyToaster />
      </Suspense>
    </AuthProvider>
  </BrowserRouter>
)
