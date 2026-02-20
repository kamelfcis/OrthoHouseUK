import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import App from './App'
import './index.css'

// Prevent page reloads on errors
if (typeof window !== 'undefined') {
  // Prevent unhandled errors from causing page reloads
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

  // Preload critical resources
  const preloadLink = document.createElement('link')
  preloadLink.rel = 'preload'
  preloadLink.as = 'style'
  preloadLink.href = '/src/index.css'
  document.head.appendChild(preloadLink)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
      <Toaster
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
    </AuthProvider>
  </BrowserRouter>
)
