import axios from 'axios'
import toast from 'react-hot-toast'

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3002/api',
  timeout: 10000,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const { response } = error

    if (response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    if (response?.status === 403) {
      toast.error('Acesso negado')
      return Promise.reject(error)
    }

    if (response?.status === 404) {
      toast.error('Recurso não encontrado')
      return Promise.reject(error)
    }

    if (response?.status >= 500) {
      toast.error('Erro interno do servidor')
      return Promise.reject(error)
    }

    // Network error
    if (!response) {
      toast.error('Erro de conexão com o servidor')
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default api
