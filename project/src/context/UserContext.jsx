import { createContext, useContext, useState } from 'react'

const UserContext = createContext()

export function useUser() {
  return useContext(UserContext)
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)

  const login = (userData, admin = false) => {
    setUser(userData)
    setIsAdmin(admin)
  }

  const logout = () => {
    setUser(null)
    setIsAdmin(false)
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