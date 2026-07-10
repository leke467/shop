import { createContext, useContext, useState } from 'react'

const UserContext = createContext()

export function useUser() {
  return useContext(UserContext)
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      return null
    }
  })
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('isAdmin') === 'true'
  })

  const login = (userData, admin = false) => {
    setUser(userData)
    setIsAdmin(admin)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('isAdmin', admin ? 'true' : 'false')
  }

  const logout = () => {
    setUser(null)
    setIsAdmin(false)
    localStorage.removeItem('user')
    localStorage.removeItem('isAdmin')
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
  }

  const checkAdmin = () => {
    return isAdmin
  }

  const value = {
    user,
    isAdmin,
    login,
    logout,
    checkAdmin
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}