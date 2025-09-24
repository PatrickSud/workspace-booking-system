import api from './api'

export const buildingService = {
  // Get all buildings
  getBuildings: async (params = {}) => {
    const response = await api.get('/buildings', { params })
    return response.data
  },

  // Get building by ID
  getBuildingById: async (id) => {
    const response = await api.get(`/buildings/${id}`)
    return response.data
  },

  // Create building
  createBuilding: async (buildingData) => {
    const response = await api.post('/buildings', buildingData)
    return response.data
  },

  // Update building
  updateBuilding: async (id, buildingData) => {
    const response = await api.put(`/buildings/${id}`, buildingData)
    return response.data
  },

  // Delete building
  deleteBuilding: async (id) => {
    const response = await api.delete(`/buildings/${id}`)
    return response.data
  },

  // Get building statistics
  getBuildingStats: async (id) => {
    const response = await api.get(`/buildings/${id}/stats`)
    return response.data
  }
}
