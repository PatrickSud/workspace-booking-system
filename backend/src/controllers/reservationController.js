const { models } = require('../database/connection');
const { CustomError } = require('../middleware/errorHandler');
const { validateUUID, validateDateRange, validateTimeSlot, validateBusinessHours } = require('../utils/validation');
const { Op } = require('sequelize');
const moment = require('moment');

const getReservations = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      start_date, 
      end_date, 
      space_id, 
      user_id,
      date 
    } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    // If not admin, only show user's own reservations
    if (!req.user.role || req.user.role !== 'admin') {
      whereClause.user_id = req.user.id;
    } else if (user_id) {
      whereClause.user_id = user_id;
    }

    if (status) {
      whereClause.status = status;
    }

    if (space_id && validateUUID(space_id)) {
      whereClause.space_id = space_id;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      whereClause.start_time = {
        [Op.gte]: startOfDay,
        [Op.lte]: endOfDay
      };
    } else if (start_date && end_date) {
      const dateValidation = validateDateRange(start_date, end_date);
      if (!dateValidation.valid) {
        throw new CustomError(dateValidation.message, 'INVALID_DATE_RANGE', 400);
      }

      whereClause.start_time = {
        [Op.gte]: new Date(start_date),
        [Op.lte]: new Date(end_date)
      };
    }

    const { count, rows: reservations } = await models.Reservation.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: models.User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: models.Space,
          as: 'space',
          attributes: ['id', 'name', 'type', 'capacity'],
          include: [
            {
              model: models.Floor,
              as: 'floor',
              attributes: ['id', 'name', 'floor_number'],
              include: [
                {
                  model: models.Building,
                  as: 'building',
                  attributes: ['id', 'name', 'address']
                }
              ]
            }
          ]
        }
      ],
      order: [['start_time', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        reservations,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getUserReservations = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { user_id: req.user.id };

    if (status) {
      whereClause.status = status;
    }

    if (start_date && end_date) {
      const dateValidation = validateDateRange(start_date, end_date);
      if (!dateValidation.valid) {
        throw new CustomError(dateValidation.message, 'INVALID_DATE_RANGE', 400);
      }

      whereClause.start_time = {
        [Op.gte]: new Date(start_date),
        [Op.lte]: new Date(end_date)
      };
    }

    const { count, rows: reservations } = await models.Reservation.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: models.Space,
          as: 'space',
          attributes: ['id', 'name', 'type', 'capacity'],
          include: [
            {
              model: models.Floor,
              as: 'floor',
              attributes: ['id', 'name', 'floor_number'],
              include: [
                {
                  model: models.Building,
                  as: 'building',
                  attributes: ['id', 'name', 'address']
                }
              ]
            }
          ]
        },
        {
          model: models.CheckIn,
          as: 'checkIn',
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['start_time', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        reservations,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(count / limit),
          total_items: count,
          items_per_page: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getReservationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!validateUUID(id)) {
      throw new CustomError('ID da reserva inválido', 'INVALID_RESERVATION_ID', 400);
    }

    const reservation = await models.Reservation.findByPk(id, {
      include: [
        {
          model: models.User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'department']
        },
        {
          model: models.Space,
          as: 'space',
          include: [
            {
              model: models.Floor,
              as: 'floor',
              include: [
                {
                  model: models.Building,
                  as: 'building'
                }
              ]
            }
          ]
        },
        {
          model: models.CheckIn,
          as: 'checkIn',
          required: false
        }
      ]
    });

    if (!reservation) {
      throw new CustomError('Reserva não encontrada', 'RESERVATION_NOT_FOUND', 404);
    }

    // Users can only see their own reservations, admins can see all
    if (req.user.role !== 'admin' && reservation.user_id !== req.user.id) {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    res.json({
      success: true,
      data: { reservation }
    });
  } catch (error) {
    next(error);
  }
};

const createReservation = async (req, res, next) => {
  try {
    const {
      space_id,
      start_time,
      end_time,
      title,
      description,
      attendees_count = 1,
      is_recurring = false,
      recurring_pattern
    } = req.body;

    if (!space_id || !start_time || !end_time) {
      throw new CustomError(
        'ID do espaço, horário de início e fim são obrigatórios',
        'MISSING_REQUIRED_FIELDS',
        400
      );
    }

    if (!validateUUID(space_id)) {
      throw new CustomError('ID do espaço inválido', 'INVALID_SPACE_ID', 400);
    }

    // Validate date range
    const dateValidation = validateDateRange(start_time, end_time);
    if (!dateValidation.valid) {
      throw new CustomError(dateValidation.message, 'INVALID_DATE_RANGE', 400);
    }

    // Get space with building settings
    const space = await models.Space.findByPk(space_id, {
      include: [
        {
          model: models.Floor,
          as: 'floor',
          include: [
            {
              model: models.Building,
              as: 'building'
            }
          ]
        }
      ]
    });

    if (!space) {
      throw new CustomError('Espaço não encontrado', 'SPACE_NOT_FOUND', 404);
    }

    if (!space.is_active || !space.is_bookable) {
      throw new CustomError('Espaço não disponível para reserva', 'SPACE_NOT_BOOKABLE', 400);
    }

    if (!space.floor.building.is_active) {
      throw new CustomError('Prédio não está ativo', 'BUILDING_NOT_ACTIVE', 400);
    }

    // Validate capacity
    if (attendees_count > space.capacity) {
      throw new CustomError(
        `Número de participantes (${attendees_count}) excede a capacidade do espaço (${space.capacity})`,
        'EXCEEDS_CAPACITY',
        400
      );
    }

    // Basic time validation (just check that end_time is after start_time)
    if (new Date(end_time) <= new Date(start_time)) {
      throw new CustomError('Horário de fim deve ser posterior ao horário de início', 'INVALID_TIME_SLOT', 400);
    }

    // Validate business hours
    const buildingSettings = space.floor.building.settings;
    if (buildingSettings.business_hours) {
      const businessHoursValidation = validateBusinessHours(
        start_time,
        end_time,
        buildingSettings.business_hours
      );

      if (!businessHoursValidation.valid) {
        throw new CustomError(businessHoursValidation.message, 'OUTSIDE_BUSINESS_HOURS', 400);
      }
    }

    // Check for conflicts
    const conflictingReservations = await models.Reservation.count({
      where: {
        space_id,
        status: ['confirmed', 'checked_in'],
        [Op.or]: [
          {
            start_time: {
              [Op.between]: [start_time, end_time]
            }
          },
          {
            end_time: {
              [Op.between]: [start_time, end_time]
            }
          },
          {
            start_time: { [Op.lte]: start_time },
            end_time: { [Op.gte]: end_time }
          }
        ]
      }
    });

    if (conflictingReservations > 0) {
      throw new CustomError('Espaço já está reservado neste horário', 'TIME_CONFLICT', 409);
    }

    // Check user's concurrent booking limit
    const buildingRules = buildingSettings.booking_rules;
    if (buildingRules.max_concurrent_bookings) {
      const userActiveReservations = await models.Reservation.count({
        where: {
          user_id: req.user.id,
          status: ['confirmed', 'checked_in'],
          end_time: { [Op.gt]: new Date() }
        }
      });

      if (userActiveReservations >= buildingRules.max_concurrent_bookings) {
        throw new CustomError(
          `Você já possui ${userActiveReservations} reservas ativas. Limite máximo: ${buildingRules.max_concurrent_bookings}`,
          'MAX_CONCURRENT_BOOKINGS_EXCEEDED',
          400
        );
      }
    }

    // Create reservation
    const reservation = await models.Reservation.create({
      user_id: req.user.id,
      space_id,
      start_time,
      end_time,
      title: title?.trim(),
      description: description?.trim(),
      attendees_count,
      is_recurring,
      recurring_pattern,
      metadata: {
        source: 'web',
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      }
    });

    // Handle recurring reservations
    if (is_recurring && recurring_pattern) {
      await createRecurringReservations(reservation, recurring_pattern, space, req.user.id);
    }

    // Get complete reservation data
    const completeReservation = await models.Reservation.findByPk(reservation.id, {
      include: [
        {
          model: models.Space,
          as: 'space',
          include: [
            {
              model: models.Floor,
              as: 'floor',
              include: [
                {
                  model: models.Building,
                  as: 'building',
                  attributes: ['id', 'name']
                }
              ]
            }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: { reservation: completeReservation },
      message: 'Reserva criada com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

const updateReservation = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!validateUUID(id)) {
      throw new CustomError('ID da reserva inválido', 'INVALID_RESERVATION_ID', 400);
    }

    const reservation = await models.Reservation.findByPk(id, {
      include: [
        {
          model: models.Space,
          as: 'space',
          include: [
            {
              model: models.Floor,
              as: 'floor',
              include: [
                {
                  model: models.Building,
                  as: 'building'
                }
              ]
            }
          ]
        }
      ]
    });

    if (!reservation) {
      throw new CustomError('Reserva não encontrada', 'RESERVATION_NOT_FOUND', 404);
    }

    // Users can only update their own reservations, admins can update any
    if (req.user.role !== 'admin' && reservation.user_id !== req.user.id) {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    // Can't update past or checked-in reservations
    if (reservation.start_time < new Date() || reservation.status === 'checked_in') {
      throw new CustomError('Não é possível alterar reservas passadas ou com check-in realizado', 'CANNOT_UPDATE_PAST_RESERVATION', 400);
    }

    const { start_time, end_time, title, description, attendees_count } = req.body;

    const updates = {};

    // Handle time changes
    if (start_time || end_time) {
      const newStartTime = start_time ? new Date(start_time) : reservation.start_time;
      const newEndTime = end_time ? new Date(end_time) : reservation.end_time;

      // Validate new time range
      const dateValidation = validateDateRange(newStartTime, newEndTime);
      if (!dateValidation.valid) {
        throw new CustomError(dateValidation.message, 'INVALID_DATE_RANGE', 400);
      }

      // Check for conflicts (excluding current reservation)
      const conflictingReservations = await models.Reservation.count({
        where: {
          space_id: reservation.space_id,
          status: ['confirmed', 'checked_in'],
          id: { [Op.ne]: id },
          [Op.or]: [
            {
              start_time: {
                [Op.between]: [newStartTime, newEndTime]
              }
            },
            {
              end_time: {
                [Op.between]: [newStartTime, newEndTime]
              }
            },
            {
              start_time: { [Op.lte]: newStartTime },
              end_time: { [Op.gte]: newEndTime }
            }
          ]
        }
      });

      if (conflictingReservations > 0) {
        throw new CustomError('Espaço já está reservado no novo horário', 'TIME_CONFLICT', 409);
      }

      updates.start_time = newStartTime;
      updates.end_time = newEndTime;
    }

    if (title !== undefined) updates.title = title?.trim();
    if (description !== undefined) updates.description = description?.trim();
    if (attendees_count && attendees_count <= reservation.space.capacity) {
      updates.attendees_count = attendees_count;
    }

    await reservation.update(updates);

    // Get updated reservation
    const updatedReservation = await models.Reservation.findByPk(id, {
      include: [
        {
          model: models.Space,
          as: 'space',
          include: [
            {
              model: models.Floor,
              as: 'floor',
              include: [
                {
                  model: models.Building,
                  as: 'building',
                  attributes: ['id', 'name']
                }
              ]
            }
          ]
        }
      ]
    });

    res.json({
      success: true,
      data: { reservation: updatedReservation },
      message: 'Reserva atualizada com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

const cancelReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!validateUUID(id)) {
      throw new CustomError('ID da reserva inválido', 'INVALID_RESERVATION_ID', 400);
    }

    const reservation = await models.Reservation.findByPk(id);

    if (!reservation) {
      throw new CustomError('Reserva não encontrada', 'RESERVATION_NOT_FOUND', 404);
    }

    // Users can only cancel their own reservations, admins can cancel any
    if (req.user.role !== 'admin' && reservation.user_id !== req.user.id) {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    // Can't cancel past reservations
    if (reservation.start_time < new Date()) {
      throw new CustomError('Não é possível cancelar reservas passadas', 'CANNOT_CANCEL_PAST_RESERVATION', 400);
    }

    if (reservation.status === 'cancelled') {
      throw new CustomError('Reserva já foi cancelada', 'ALREADY_CANCELLED', 400);
    }

    await reservation.update({
      status: 'cancelled',
      cancellation_reason: reason?.trim(),
      cancelled_at: new Date(),
      cancelled_by: req.user.id
    });

    res.json({
      success: true,
      message: 'Reserva cancelada com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

const checkInReservation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { location } = req.body;

    if (!validateUUID(id)) {
      throw new CustomError('ID da reserva inválido', 'INVALID_RESERVATION_ID', 400);
    }

    const reservation = await models.Reservation.findByPk(id, {
      include: [
        {
          model: models.Space,
          as: 'space',
          include: [
            {
              model: models.Floor,
              as: 'floor',
              include: [
                {
                  model: models.Building,
                  as: 'building'
                }
              ]
            }
          ]
        }
      ]
    });

    if (!reservation) {
      throw new CustomError('Reserva não encontrada', 'RESERVATION_NOT_FOUND', 404);
    }

    // Users can only check-in to their own reservations
    if (reservation.user_id !== req.user.id) {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    if (reservation.status !== 'confirmed') {
      throw new CustomError('Apenas reservas confirmadas podem ter check-in', 'INVALID_STATUS_FOR_CHECKIN', 400);
    }

    const now = new Date();
    const checkInWindow = reservation.space.booking_rules.auto_release_minutes || 15;
    const checkInStart = new Date(reservation.start_time.getTime() - checkInWindow * 60000);
    const checkInEnd = new Date(reservation.start_time.getTime() + checkInWindow * 60000);

    if (now < checkInStart || now > checkInEnd) {
      throw new CustomError(
        `Check-in disponível apenas entre ${checkInStart.toLocaleTimeString()} e ${checkInEnd.toLocaleTimeString()}`,
        'OUTSIDE_CHECKIN_WINDOW',
        400
      );
    }

    // Check if already checked in
    const existingCheckIn = await models.CheckIn.findOne({
      where: { reservation_id: id }
    });

    if (existingCheckIn) {
      throw new CustomError('Check-in já foi realizado para esta reserva', 'ALREADY_CHECKED_IN', 400);
    }

    // Create check-in record
    await models.CheckIn.create({
      user_id: req.user.id,
      reservation_id: id,
      method: 'manual',
      location,
      device_info: {
        user_agent: req.get('User-Agent'),
        ip_address: req.ip
      }
    });

    // Update reservation status
    await reservation.update({
      status: 'checked_in',
      check_in_time: now
    });

    res.json({
      success: true,
      message: 'Check-in realizado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to create recurring reservations
const createRecurringReservations = async (parentReservation, pattern, space, userId) => {
  const { type, interval, days_of_week, end_date } = pattern;
  const maxRecurrences = 52; // Limit to 1 year
  let currentDate = moment(parentReservation.start_time);
  const endDate = moment(end_date);
  const duration = moment(parentReservation.end_time).diff(moment(parentReservation.start_time));
  
  const createdReservations = [];
  let count = 0;

  while (currentDate.isBefore(endDate) && count < maxRecurrences) {
    let nextDate;

    switch (type) {
      case 'daily':
        nextDate = currentDate.clone().add(interval, 'days');
        break;
      case 'weekly':
        nextDate = currentDate.clone().add(interval, 'weeks');
        break;
      case 'monthly':
        nextDate = currentDate.clone().add(interval, 'months');
        break;
      default:
        return;
    }

    // Skip if not in specified days of week (for weekly pattern)
    if (type === 'weekly' && days_of_week && !days_of_week.includes(nextDate.day())) {
      currentDate = nextDate;
      continue;
    }

    const nextStartTime = nextDate.toDate();
    const nextEndTime = new Date(nextStartTime.getTime() + duration);

    // Check for conflicts
    const conflicts = await models.Reservation.count({
      where: {
        space_id: space.id,
        status: ['confirmed', 'checked_in'],
        [Op.or]: [
          {
            start_time: {
              [Op.between]: [nextStartTime, nextEndTime]
            }
          },
          {
            end_time: {
              [Op.between]: [nextStartTime, nextEndTime]
            }
          },
          {
            start_time: { [Op.lte]: nextStartTime },
            end_time: { [Op.gte]: nextEndTime }
          }
        ]
      }
    });

    if (conflicts === 0) {
      try {
        const recurringReservation = await models.Reservation.create({
          user_id: userId,
          space_id: space.id,
          start_time: nextStartTime,
          end_time: nextEndTime,
          title: parentReservation.title,
          description: parentReservation.description,
          attendees_count: parentReservation.attendees_count,
          parent_reservation_id: parentReservation.id,
          is_recurring: false // Child reservations are not recurring themselves
        });

        createdReservations.push(recurringReservation);
      } catch (error) {
        console.error('Error creating recurring reservation:', error);
      }
    }

    currentDate = nextDate;
    count++;
  }

  return createdReservations;
};

module.exports = {
  getReservations,
  getUserReservations,
  getReservationById,
  createReservation,
  updateReservation,
  cancelReservation,
  checkInReservation
};
