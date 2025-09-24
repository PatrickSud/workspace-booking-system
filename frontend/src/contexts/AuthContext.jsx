import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { authService } from '../services/authService'

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
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token')
        
        if (token) {
          const userData = await authService.getProfile()
          setUser(userData.user)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        localStorage.removeItem('token')
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (email, password) => {
    try {
      setLoading(true)
      const response = await authService.login(email, password)
      
      localStorage.setItem('token', response.token)
      setUser(response.user)
      
      toast.success(`Bem-vindo, ${response.user.name}!`)
      navigate('/dashboard')
      
      return response
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Erro ao fazer login'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setLoading(true)
      const response = await authService.register(userData)
      
      localStorage.setItem('token', response.token)
      setUser(response.user)
      
      toast.success(`Conta criada com sucesso! Bem-vindo, ${response.user.name}!`)
      navigate('/dashboard')
      
      return response
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Erro ao criar conta'
      toast.error(message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      localStorage.removeItem('token')
      setUser(null)
      navigate('/login')
      toast.success('Logout realizado com sucesso')
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData)
      setUser(response.user)
      toast.success('Perfil atualizado com sucesso')
      return response
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Erro ao atualizar perfil'
      toast.error(message)
      throw error
    }
  }

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword)
      toast.success('Senha alterada com sucesso')
    } catch (error) {
      const message = error.response?.data?.error?.message || 'Erro ao alterar senha'
      toast.error(message)
      throw error
    }
  }

  const refreshToken = async () => {
    try {
      const response = await authService.refreshToken()
      localStorage.setItem('token', response.token)
      setUser(response.user)
      return response
    } catch (error) {
      console.error('Error refreshing token:', error)
      logout()
      throw error
    }
  }

  const isAdmin = () => {
    return user?.role === 'admin'
  }

  const hasPermission = (permission) => {
    if (!user) return false
    
    // Admin has all permissions
    if (user.role === 'admin') return true
    
    // Add specific permission logic here if needed
    switch (permission) {
      case 'view_reports':
      case 'manage_users':
      case 'manage_buildings':
      case 'manage_spaces':
        return user.role === 'admin'
      case 'create_reservations':
      case 'view_own_reservations':
        return true
      default:
        return false
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshToken,
    isAdmin,
    hasPermission,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
