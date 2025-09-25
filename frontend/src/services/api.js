import axios from 'axios'
import toast from 'react-hot-toast'

// Firebase Functions base URL
const FIREBASE_FUNCTIONS_URL =
  import.meta.env.VITE_FIREBASE_FUNCTIONS_URL ||
  'https://southamerica-east1-workspace-booking-system.cloudfunctions.net'

// Create axios instance
const api = axios.create({
  baseURL: FIREBASE_FUNCTIONS_URL,
  timeout: 30000 // Firebase Functions podem demorar mais para inicializar
})

// Request interceptor to add auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  response => {
    return response
  },
  error => {
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
