import api from './api'

export const floorService = {
  // Get floors by building
  getFloorsByBuilding: async (buildingId, params = {}) => {
    const response = await api.get(`/floors/building/${buildingId}`, { params })
    return response.data
  },

  // Get floor by ID
  getFloorById: async (id) => {
    const response = await api.get(`/floors/${id}`)
    return response.data
  },

  // Create floor
  createFloor: async (floorData) => {
    const response = await api.post('/floors', floorData)
    return response.data
  },

  // Update floor
  updateFloor: async (id, floorData) => {
    const response = await api.put(`/floors/${id}`, floorData)
    return response.data
  },

  // Delete floor
  deleteFloor: async (id) => {
    const response = await api.delete(`/floors/${id}`)
    return response.data
  },

  // Upload floor plan
  uploadFloorPlan: async (id, file) => {
    const formData = new FormData()
    formData.append('floor_plan', file)
    
    const response = await api.post(`/floors/${id}/floor-plan`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }
}
