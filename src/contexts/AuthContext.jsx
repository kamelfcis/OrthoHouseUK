import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const location = useLocation()
  const authStarted = useRef(false)
  const subscriptionRef = useRef(null)
  const [user, setUser] = useState(null)
  const [appUser, setAppUser] = useState(null)
  const [loading, setLoading] = useState(() => location.pathname.startsWith('/admin'))
  const [session, setSession] = useState(null)

  useEffect(() => {
    let deferId

    const initAuth = async () => {
      if (authStarted.current) return
      authStarted.current = true

      const { supabase } = await import('../lib/supabase')

      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchAppUser(session.user.id)
        } else {
          setLoading(false)
        }
      })

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchAppUser(session.user.id)
        } else {
          setAppUser(null)
          setLoading(false)
        }
      })

      subscriptionRef.current = subscription
    }

    const scheduleAuth = (immediate = false) => {
      if (authStarted.current) return

      if (immediate) {
        initAuth()
        return
      }

      deferId = window.requestIdleCallback
        ? window.requestIdleCallback(initAuth, { timeout: 5000 })
        : setTimeout(initAuth, 3000)
    }

    if (location.pathname.startsWith('/admin')) {
      if (!authStarted.current) {
        setLoading(true)
      }
      scheduleAuth(true)
    } else {
      setLoading(false)
      scheduleAuth(false)
    }

    return () => {
      if (deferId) {
        if (window.requestIdleCallback) {
          window.cancelIdleCallback(deferId)
        } else {
          clearTimeout(deferId)
        }
      }
    }
  }, [location.pathname])

  const fetchAppUser = async (authUserId) => {
    try {
      const { supabase } = await import('../lib/supabase')
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .eq('is_active', true)
        .single()

      if (error) throw error
      setAppUser(data)
    } catch (error) {
      console.error('Error fetching app user:', error)
      setAppUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      const { supabase } = await import('../lib/supabase')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        await fetchAppUser(data.user.id)
      }

      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const { supabase } = await import('../lib/supabase')
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setAppUser(null)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const value = {
    user,
    appUser,
    session,
    loading,
    signIn,
    signOut,
    isAdmin: appUser?.user_type === 'admin',
    isBranchManager: appUser?.user_type === 'branch_content_manager',
    canAccessAdmin: appUser?.user_type === 'admin' || appUser?.user_type === 'branch_content_manager',
  }

  useEffect(() => {
    return () => subscriptionRef.current?.unsubscribe()
  }, [])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

