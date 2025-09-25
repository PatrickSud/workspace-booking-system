import api from './api'
import { mockAuthService } from './mockAuthService'

// Detectar se estamos no GitHub Pages (sem backend disponível)
const isGitHubPages = window.location.hostname === 'patricksud.github.io'

// Mostrar notificação de demonstração
if (isGitHubPages) {
  console.log('🚀 Modo Demonstração: Usando dados mockados para GitHub Pages')
}

export const authService = {
  // Login user
  login: async (email, password) => {
    if (isGitHubPages) {
      return await mockAuthService.login(email, password)
    }
    const response = await api.post('/login', { email, password })
    return response.data.data
  },

  // Register user
  register: async userData => {
    if (isGitHubPages) {
      return await mockAuthService.register(userData)
    }
    const response = await api.post('/register', userData)
    return response.data.data
  },

  // Get user profile
  getProfile: async () => {
    if (isGitHubPages) {
      return await mockAuthService.getProfile()
    }
    const response = await api.get('/getProfile')
    return response.data.data
  },

  // Update user profile
  updateProfile: async profileData => {
    if (isGitHubPages) {
      return await mockAuthService.updateProfile(profileData)
    }
    const response = await api.put('/updateProfile', profileData)
    return response.data.data
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    if (isGitHubPages) {
      return await mockAuthService.changePassword(currentPassword, newPassword)
    }
    const response = await api.put('/changePassword', {
      currentPassword,
      newPassword
    })
    return response.data.data
  },

  // Refresh token
  refreshToken: async () => {
    if (isGitHubPages) {
      return await mockAuthService.refreshToken()
    }
    const response = await api.post('/refreshToken')
    return response.data.data
  },

  // Logout
  logout: async () => {
    if (isGitHubPages) {
      return await mockAuthService.logout()
    }
    const response = await api.post('/logout')
    return response.data.data
  }
}
