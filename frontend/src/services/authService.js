import api from './api'

export const authService = {
  // Login user
  login: async (email, password) => {
    const response = await api.post('/login', { email, password })
    return response.data.data
  },

  // Register user
  register: async userData => {
    const response = await api.post('/register', userData)
    return response.data.data
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/getProfile')
    return response.data.data
  },

  // Update user profile
  updateProfile: async profileData => {
    const response = await api.put('/updateProfile', profileData)
    return response.data.data
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/changePassword', {
      currentPassword,
      newPassword
    })
    return response.data.data
  },

  // Refresh token
  refreshToken: async () => {
    const response = await api.post('/refreshToken')
    return response.data.data
  },

  // Logout
  logout: async () => {
    const response = await api.post('/logout')
    return response.data.data
  }
}
