/**
 * Auth context — cookie-based JWT.
 * 
 * Tokens live in HttpOnly cookies (managed by the backend).
 * This context only stores the user profile object and auth state.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'

const UserContext = createContext()

export function useUser() {
  return useContext(UserContext)
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On mount, try to fetch the profile (cookie-based — no localStorage needed)
  useEffect(() => {
    authAPI.profile()
      .then(data => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await authAPI.login(email, password)
    setUser(data.user)
    return data
  }, [])

  const register = useCallback(async (formData) => {
    const data = await authAPI.register(formData)
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(async () => {
    try { await authAPI.logout() } catch { /* ignore */ }
    setUser(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    try {
      const data = await authAPI.profile()
      setUser(data)
    } catch { setUser(null) }
  }, [])

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isSeller: user?.role === 'seller' || user?.role === 'admin',
    login,
    register,
    logout,
    refreshProfile,
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}