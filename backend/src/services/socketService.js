const jwt = require('jsonwebtoken');
const { models } = require('../database/connection');

// Store connected clients
const connectedClients = new Map();

const socketHandler = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await models.User.findByPk(decoded.userId);

      if (!user || !user.is_active) {
        return next(new Error('Authentication error: Invalid user'));
      }

      socket.userId = user.id;
      socket.userRole = user.role;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected via WebSocket`);
    
    // Store client connection
    connectedClients.set(socket.userId, {
      socketId: socket.id,
      userId: socket.userId,
      userRole: socket.userRole,
      connectedAt: new Date()
    });

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Join admin users to admin room
    if (socket.userRole === 'admin') {
      socket.join('admins');
    }

    // Handle joining building/floor rooms for real-time updates
    socket.on('join-building', (buildingId) => {
      socket.join(`building:${buildingId}`);
      console.log(`User ${socket.userId} joined building room: ${buildingId}`);
    });

    socket.on('join-floor', (floorId) => {
      socket.join(`floor:${floorId}`);
      console.log(`User ${socket.userId} joined floor room: ${floorId}`);
    });

    socket.on('leave-building', (buildingId) => {
      socket.leave(`building:${buildingId}`);
      console.log(`User ${socket.userId} left building room: ${buildingId}`);
    });

    socket.on('leave-floor', (floorId) => {
      socket.leave(`floor:${floorId}`);
      console.log(`User ${socket.userId} left floor room: ${floorId}`);
    });

    // Handle real-time space status requests
    socket.on('get-space-status', async (spaceId) => {
      try {
        const space = await models.Space.findByPk(spaceId, {
          include: [
            {
              model: models.Reservation,
              as: 'reservations',
              where: {
                status: ['confirmed', 'checked_in'],
                start_time: { [models.Sequelize.Op.lte]: new Date() },
                end_time: { [models.Sequelize.Op.gt]: new Date() }
              },
              required: false,
              include: [
                {
                  model: models.User,
                  as: 'user',
                  attributes: ['id', 'name']
                }
              ]
            }
          ]
        });

        if (space) {
          const isOccupied = space.reservations && space.reservations.length > 0;
          const currentReservation = isOccupied ? space.reservations[0] : null;

          socket.emit('space-status', {
            space_id: spaceId,
            is_occupied: isOccupied,
            current_reservation: currentReservation,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('Error getting space status:', error);
        socket.emit('error', { message: 'Failed to get space status' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
      connectedClients.delete(socket.userId);
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to workspace booking system',
      userId: socket.userId,
      timestamp: new Date()
    });
  });

  return io;
};

// Helper functions to emit events to specific rooms
const emitToUser = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

const emitToAdmins = (io, event, data) => {
  io.to('admins').emit(event, data);
};

const emitToBuilding = (io, buildingId, event, data) => {
  io.to(`building:${buildingId}`).emit(event, data);
};

const emitToFloor = (io, floorId, event, data) => {
  io.to(`floor:${floorId}`).emit(event, data);
};

// Event handlers for reservation changes
const handleReservationCreated = (io, reservation) => {
  // Notify all users in the building about new reservation
  if (reservation.space && reservation.space.floor && reservation.space.floor.building_id) {
    emitToBuilding(io, reservation.space.floor.building_id, 'reservation-created', {
      reservation_id: reservation.id,
      space_id: reservation.space_id,
      user_id: reservation.user_id,
      start_time: reservation.start_time,
      end_time: reservation.end_time,
      timestamp: new Date()
    });
  }

  // Notify the user who made the reservation
  emitToUser(io, reservation.user_id, 'reservation-confirmed', {
    reservation_id: reservation.id,
    message: 'Sua reserva foi confirmada',
    timestamp: new Date()
  });

  // Notify admins
  emitToAdmins(io, 'new-reservation', {
    reservation_id: reservation.id,
    user_id: reservation.user_id,
    space_id: reservation.space_id,
    timestamp: new Date()
  });
};

const handleReservationUpdated = (io, reservation) => {
  // Notify all users in the building about reservation update
  if (reservation.space && reservation.space.floor && reservation.space.floor.building_id) {
    emitToBuilding(io, reservation.space.floor.building_id, 'reservation-updated', {
      reservation_id: reservation.id,
      space_id: reservation.space_id,
      user_id: reservation.user_id,
      start_time: reservation.start_time,
      end_time: reservation.end_time,
      status: reservation.status,
      timestamp: new Date()
    });
  }

  // Notify the user who owns the reservation
  emitToUser(io, reservation.user_id, 'reservation-updated', {
    reservation_id: reservation.id,
    message: 'Sua reserva foi atualizada',
    timestamp: new Date()
  });
};

const handleReservationCancelled = (io, reservation) => {
  // Notify all users in the building about cancellation
  if (reservation.space && reservation.space.floor && reservation.space.floor.building_id) {
    emitToBuilding(io, reservation.space.floor.building_id, 'reservation-cancelled', {
      reservation_id: reservation.id,
      space_id: reservation.space_id,
      user_id: reservation.user_id,
      timestamp: new Date()
    });
  }

  // Notify the user who owned the reservation
  emitToUser(io, reservation.user_id, 'reservation-cancelled', {
    reservation_id: reservation.id,
    message: 'Sua reserva foi cancelada',
    timestamp: new Date()
  });
};

const handleCheckIn = (io, checkIn, reservation) => {
  // Notify all users in the building about check-in
  if (reservation.space && reservation.space.floor && reservation.space.floor.building_id) {
    emitToBuilding(io, reservation.space.floor.building_id, 'space-occupied', {
      space_id: reservation.space_id,
      user_id: checkIn.user_id,
      reservation_id: reservation.id,
      timestamp: new Date()
    });
  }

  // Notify the user about successful check-in
  emitToUser(io, checkIn.user_id, 'check-in-success', {
    reservation_id: reservation.id,
    space_id: reservation.space_id,
    message: 'Check-in realizado com sucesso',
    timestamp: new Date()
  });

  // Notify admins
  emitToAdmins(io, 'user-checked-in', {
    user_id: checkIn.user_id,
    space_id: reservation.space_id,
    reservation_id: reservation.id,
    timestamp: new Date()
  });
};

const handleCheckOut = (io, checkIn, reservation) => {
  // Notify all users in the building about check-out
  if (reservation.space && reservation.space.floor && reservation.space.floor.building_id) {
    emitToBuilding(io, reservation.space.floor.building_id, 'space-available', {
      space_id: reservation.space_id,
      user_id: checkIn.user_id,
      reservation_id: reservation.id,
      timestamp: new Date()
    });
  }

  // Notify the user about check-out
  emitToUser(io, checkIn.user_id, 'check-out-success', {
    reservation_id: reservation.id,
    space_id: reservation.space_id,
    message: 'Check-out realizado com sucesso',
    timestamp: new Date()
  });
};

const handleSpaceStatusChange = (io, spaceId, status, buildingId) => {
  // Notify all users in the building about space status change
  emitToBuilding(io, buildingId, 'space-status-changed', {
    space_id: spaceId,
    status: status, // 'available', 'occupied', 'reserved'
    timestamp: new Date()
  });
};

// System notifications
const sendSystemNotification = (io, userId, message, type = 'info') => {
  emitToUser(io, userId, 'system-notification', {
    message,
    type, // 'info', 'warning', 'error', 'success'
    timestamp: new Date()
  });
};

const sendBroadcastNotification = (io, message, type = 'info') => {
  io.emit('system-notification', {
    message,
    type,
    timestamp: new Date()
  });
};

// Get connected clients info (for admin dashboard)
const getConnectedClients = () => {
  return Array.from(connectedClients.values());
};

module.exports = socketHandler;
