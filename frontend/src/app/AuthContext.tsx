import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '../api'
import { API_BASE_URL } from '../api/client'
import type { User } from '../types'
import { AuthContext, type AuthValue } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      setUser(await authApi.me())
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const value = useMemo<AuthValue>(() => ({
    user,
    loading,
    refresh,
    loginUrl: `${API_BASE_URL}/api/auth/login`,
    logout: async () => {
      await authApi.logout()
      setUser(null)
    },
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
