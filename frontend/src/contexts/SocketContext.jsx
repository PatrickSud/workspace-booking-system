import React, { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'

import { useAuth } from './AuthContext'

const SocketContext = createContext({})

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('token')
      
      if (token) {
        const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3002'
        
        const newSocket = io(socketUrl, {
          auth: {
            token: token
          },
          transports: ['websocket', 'polling']
        })

        newSocket.on('connect', () => {
          console.log('Connected to server')
          setConnected(true)
          setSocket(newSocket)
        })

        newSocket.on('disconnect', () => {
          console.log('Disconnected from server')
          setConnected(false)
        })

        newSocket.on('connect_error', (error) => {
          console.error('Connection error:', error)
          setConnected(false)
        })

        // Handle real-time notifications
        newSocket.on('reservation-confirmed', (data) => {
          toast.success('Reserva confirmada!')
        })

        newSocket.on('reservation-updated', (data) => {
          toast.info('Uma de suas reservas foi atualizada')
        })

        newSocket.on('reservation-cancelled', (data) => {
          toast.info('Uma de suas reservas foi cancelada')
        })

        newSocket.on('check-in-success', (data) => {
          toast.success('Check-in realizado com sucesso!')
        })

        newSocket.on('check-out-success', (data) => {
          toast.success('Check-out realizado com sucesso!')
        })

        newSocket.on('system-notification', (data) => {
          switch (data.type) {
            case 'success':
              toast.success(data.message)
              break
            case 'error':
              toast.error(data.message)
              break
            case 'warning':
              toast.error(data.message, { icon: '⚠️' })
              break
            case 'info':
            default:
              toast(data.message, { icon: 'ℹ️' })
              break
          }
        })

        // Handle space status updates
        newSocket.on('space-status-changed', (data) => {
          // This will be handled by specific components that need real-time updates
          console.log('Space status changed:', data)
        })

        newSocket.on('reservation-created', (data) => {
          // Handle new reservation notifications
          console.log('New reservation created:', data)
        })

        newSocket.on('space-occupied', (data) => {
          console.log('Space occupied:', data)
        })

        newSocket.on('space-available', (data) => {
          console.log('Space available:', data)
        })

        return () => {
          newSocket.close()
        }
      }
    } else {
      // Clean up socket when user logs out
      if (socket) {
        socket.close()
        setSocket(null)
        setConnected(false)
      }
    }
  }, [isAuthenticated, user])

  // Socket utility functions
  const joinBuilding = (buildingId) => {
    if (socket && connected) {
      socket.emit('join-building', buildingId)
    }
  }

  const leaveBuilding = (buildingId) => {
    if (socket && connected) {
      socket.emit('leave-building', buildingId)
    }
  }

  const joinFloor = (floorId) => {
    if (socket && connected) {
      socket.emit('join-floor', floorId)
    }
  }

  const leaveFloor = (floorId) => {
    if (socket && connected) {
      socket.emit('leave-floor', floorId)
    }
  }

  const getSpaceStatus = (spaceId) => {
    if (socket && connected) {
      socket.emit('get-space-status', spaceId)
    }
  }

  const subscribeToSpaceStatus = (callback) => {
    if (socket) {
      socket.on('space-status', callback)
      return () => socket.off('space-status', callback)
    }
    return () => {}
  }

  const subscribeToReservationUpdates = (callback) => {
    if (socket) {
      const events = [
        'reservation-created',
        'reservation-updated',
        'reservation-cancelled',
        'space-occupied',
        'space-available'
      ]
      
      events.forEach(event => {
        socket.on(event, callback)
      })

      return () => {
        events.forEach(event => {
          socket.off(event, callback)
        })
      }
    }
    return () => {}
  }

  const emit = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data)
    }
  }

  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback)
      return () => socket.off(event, callback)
    }
    return () => {}
  }

  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback)
    }
  }

  const value = {
    socket,
    connected,
    onlineUsers,
    joinBuilding,
    leaveBuilding,
    joinFloor,
    leaveFloor,
    getSpaceStatus,
    subscribeToSpaceStatus,
    subscribeToReservationUpdates,
    emit,
    on,
    off,
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}
