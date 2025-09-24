import api from './api'

export const reportService = {
  // Get dashboard statistics
  getDashboardStats: async (params = {}) => {
    const response = await api.get('/reports/dashboard', { params })
    return response.data
  },

  // Get occupancy report
  getOccupancyReport: async (params = {}) => {
    const response = await api.get('/reports/occupancy', { params })
    return response.data
  },

  // Get usage report
  getUsageReport: async (params = {}) => {
    const response = await api.get('/reports/usage', { params })
    return response.data
  },

  // Get no-show report
  getNoShowReport: async (params = {}) => {
    const response = await api.get('/reports/no-show', { params })
    return response.data
  }
}
