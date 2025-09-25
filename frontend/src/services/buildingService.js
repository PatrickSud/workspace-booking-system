import api from './api'

export const buildingService = {
  // Get all buildings
  getBuildings: async (params = {}) => {
    const response = await api.get('/getAllBuildings', { params })
    return response.data
  },

  // Get building by ID
  getBuildingById: async id => {
    const response = await api.get(`/getBuildingById?id=${id}`)
    return response.data
  },

  // Create building
  createBuilding: async buildingData => {
    const response = await api.post('/createBuilding', buildingData)
    return response.data
  },

  // Update building
  updateBuilding: async (id, buildingData) => {
    const response = await api.put(`/updateBuilding?id=${id}`, buildingData)
    return response.data
  },

  // Delete building
  deleteBuilding: async id => {
    const response = await api.delete(`/deleteBuilding?id=${id}`)
    return response.data
  },

  // Get building statistics
  getBuildingStats: async id => {
    const response = await api.get(`/getBuildingStats?id=${id}`)
    return response.data
  }
}
