import { useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { adminLogin } from '../../content/admin'
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
        toast.error(error.message || adminLogin.toastFailed)
        return
      }

      if (data?.user) {
        setTimeout(() => {
          toast.success(adminLogin.toastSuccess)
          navigate('/admin/dashboard')
        }, 500)
      }
    } catch (error) {
      toast.error(adminLogin.toastUnexpected)
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
              <img src="/assets/images/Logo_SVG.svg" alt={adminLogin.logoAlt} className="login-logo" width={180} height={64} decoding="async" />
            </div>
            <h1 className="text-gradient-brand">{adminLogin.heading}</h1>
            <p>{adminLogin.subheading}</p>
          </div>

          <form onSubmit={handleSubmit} className="admin-login-form">
            <div className="form-group">
              <label htmlFor="email">{adminLogin.emailLabel}</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={adminLogin.emailPlaceholder}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">{adminLogin.passwordLabel}</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={adminLogin.passwordPlaceholder}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="lte-btn btn-lg"
              disabled={loading}
            >
              {loading ? adminLogin.submitting : adminLogin.submit}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
