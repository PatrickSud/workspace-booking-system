import api from './api'

export const spaceService = {
  // Get all spaces
  getSpaces: async (params = {}) => {
    const response = await api.get('/spaces', { params })
    return response.data
  },

  // Get spaces by floor
  getSpacesByFloor: async (floorId, params = {}) => {
    const response = await api.get(`/spaces/floor/${floorId}`, { params })
    return response.data
  },

  // Get space by ID
  getSpaceById: async (id) => {
    const response = await api.get(`/spaces/${id}`)
    return response.data
  },

  // Create space
  createSpace: async (spaceData) => {
    const response = await api.post('/spaces', spaceData)
    return response.data
  },

  // Update space
  updateSpace: async (id, spaceData) => {
    const response = await api.put(`/spaces/${id}`, spaceData)
    return response.data
  },

  // Delete space
  deleteSpace: async (id) => {
    const response = await api.delete(`/spaces/${id}`)
    return response.data
  },

  // Get space availability
  getSpaceAvailability: async (id, params = {}) => {
    const response = await api.get(`/spaces/${id}/availability`, { params })
    return response.data
  },

  // Regenerate QR code
  regenerateQRCode: async (id) => {
    const response = await api.post(`/spaces/${id}/qr-code`)
    return response.data
  },

  // Check-in to space
  checkIn: async (id, checkInData) => {
    const response = await api.post(`/spaces/${id}/check-in`, checkInData)
    return response.data
  }
}
