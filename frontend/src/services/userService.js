import api from './api'

export const userService = {
  // Get all users (admin only)
  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params })
    return response.data
  },

  // Get user by ID
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  // Create user (admin only)
  createUser: async (userData) => {
    const response = await api.post('/users', userData)
    return response.data
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData)
    return response.data
  },

  // Delete user (admin only)
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },

  // Get user statistics
  getUserStats: async (id) => {
    const response = await api.get(`/users/${id}/stats`)
    return response.data
  },

  // Reset user password (admin only)
  resetUserPassword: async (id, newPassword) => {
    const response = await api.put(`/users/${id}/reset-password`, { new_password: newPassword })
    return response.data
  }
}
