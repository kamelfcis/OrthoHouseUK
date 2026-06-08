import { useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import './Login.css'

const ThreeJSBackground = lazy(() => import('../../components/admin/ThreeJSBackground'))

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await signIn(email, password)

      if (error) {
        toast.error(error.message || 'Login failed')
        return
      }

      if (data?.user) {
        // Wait a moment for AuthContext to fetch app_user
        setTimeout(() => {
          toast.success('Login successful!')
          navigate('/admin/dashboard')
        }, 500)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-page">
      <Suspense fallback={null}>
        <ThreeJSBackground />
      </Suspense>
      <div className="admin-login-overlay"></div>
      <div className="admin-login-container">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <div className="login-logo-container">
              <img src="/assets/images/Logo_SVG.svg" alt="OrthoHouse" className="login-logo" width={180} height={64} decoding="async" />
            </div>
            <h1 className="text-gradient-brand">Admin Portal</h1>
            <p>Sign in to manage your content</p>
          </div>

          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="lte-btn btn-lg"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login

