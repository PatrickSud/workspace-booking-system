import api from './api'

export const reservationService = {
  // Get all reservations (admin)
  getReservations: async (params = {}) => {
    const response = await api.get('/reservations', { params })
    return response.data
  },

  // Get user's reservations (alias: getMyReservations)
  getUserReservations: async (params = {}) => {
    const response = await api.get('/reservations/my-reservations', { params })
    return response.data
  },

  // Get reservation by ID
  getReservationById: async (id) => {
    const response = await api.get(`/reservations/${id}`)
    return response.data
  },

  // Create reservation
  createReservation: async (reservationData) => {
    const response = await api.post('/reservations', reservationData)
    return response.data
  },

  // Update reservation
  updateReservation: async (id, reservationData) => {
    const response = await api.put(`/reservations/${id}`, reservationData)
    return response.data
  },

  // Cancel reservation
  cancelReservation: async (id, reason) => {
    const response = await api.put(`/reservations/${id}/cancel`, { reason })
    return response.data
  },

  // Check-in to reservation
  checkInReservation: async (id, location = null) => {
    const response = await api.post(`/reservations/${id}/check-in`, { location })
    return response.data
  }
}
