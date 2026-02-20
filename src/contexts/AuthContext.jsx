import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [appUser, setAppUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchAppUser(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
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

    return () => subscription.unsubscribe()
  }, [])

  const fetchAppUser = async (authUserId) => {
    try {
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

