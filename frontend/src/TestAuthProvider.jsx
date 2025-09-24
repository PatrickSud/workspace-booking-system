import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const TestAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  const value = {
    user,
    loading,
    login: () => {},
    register: () => {},
    logout: () => {},
    updateProfile: () => {},
    changePassword: () => {},
    refreshToken: () => {},
    isAdmin: () => false,
    hasPermission: () => false,
    isAuthenticated: false,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
