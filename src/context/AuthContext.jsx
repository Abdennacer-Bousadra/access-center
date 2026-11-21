import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.me()
      setUser(data?.user ?? null)
      return data?.user ?? null
    } catch (error) {
      if (error?.status !== 401) {
        console.error('[auth] unable to load the session:', error?.code || error?.message)
      }
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    let active = true

    api
      .me()
      .then((data) => {
        if (active) setUser(data?.user ?? null)
      })
      .catch((error) => {
        if (!active) return
        if (error?.status !== 401) {
          console.error('[auth] unable to load the session:', error?.code || error?.message)
        }
        setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    const data = await api.login(email, password)
    setUser(data?.user ?? null)
    return data?.user ?? null
  }, [])

  const register = useCallback(async (values) => {
    const data = await api.register(values)
    return data
  }, [])

  const signOut = useCallback(async () => {
    try {
      await api.logout()
    } catch (error) {
      console.error('[auth] logout failed:', error?.code || error?.message)
    } finally {
      setUser(null)
    }
  }, [])

  const verifyEmail = useCallback((token) => api.verifyEmail(token), [])
  const resendVerification = useCallback((email) => api.resendVerification(email), [])
  const requestPasswordReset = useCallback((email) => api.forgotPassword(email), [])
  const resetPassword = useCallback((values) => api.resetPassword(values), [])

  const value = useMemo(
    () => ({
      user,
      loading,
      refreshUser,
      signIn,
      register,
      signOut,
      verifyEmail,
      resendVerification,
      requestPasswordReset,
      resetPassword,
    }),
    [
      user,
      loading,
      refreshUser,
      signIn,
      register,
      signOut,
      verifyEmail,
      resendVerification,
      requestPasswordReset,
      resetPassword,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
