const { models } = require('../database/connection');
const { CustomError } = require('../middleware/errorHandler');
const { validateUUID, sanitizeString, validateCoordinates, validateCapacity } = require('../utils/validation');
const { Op } = require('sequelize');
const QRCode = require('qrcode');

const getSpaces = async (req, res, next) => {
  try {
    const { 
      building_id, 
      floor_id, 
      type, 
      capacity_min, 
      capacity_max, 
      is_bookable, 
      is_active, 
      available_at 
    } = req.query;

    // Build where conditions
    const whereConditions = {};
    
    if (building_id && validateUUID(building_id)) {
      whereConditions['$floor.building_id$'] = building_id;
    }
    
    if (floor_id && validateUUID(floor_id)) {
      whereConditions.floor_id = floor_id;
    }
    
    if (type) {
      whereConditions.type = type;
    }
    
    if (capacity_min) {
      whereConditions.capacity = { [Op.gte]: parseInt(capacity_min) };
    }
    
    if (capacity_max) {
      if (whereConditions.capacity) {
        whereConditions.capacity[Op.lte] = parseInt(capacity_max);
      } else {
        whereConditions.capacity = { [Op.lte]: parseInt(capacity_max) };
      }
    }
    
    if (is_bookable !== undefined) {
      whereConditions.is_bookable = is_bookable === 'true';
    }
    
    if (is_active !== undefined) {
      whereConditions.is_active = is_active === 'true';
    }

    const spaces = await models.Space.findAll({
      where: whereConditions,
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
      ],
      order: [
        ['floor', 'building', 'name'],
        ['floor', 'floor_number'],
        ['name']
      ]
    });

    res.json({
      success: true,
      data: {
        spaces,
        total: spaces.length
      }
    });
  } catch (error) {
    next(error);
  }
};

const getSpacesByFloor = async (req, res, next) => {
  try {
    const { floorId } = req.params;
    const { type, capacity_min, capacity_max, is_bookable, available_at } = req.query;

    if (!validateUUID(floorId)) {
      throw new CustomError('ID do andar inválido', 'INVALID_FLOOR_ID', 400);
    }

    // Check if floor exists and user has access
    const floor = await models.Floor.findByPk(floorId, {
      include: [
        {
          model: models.Building,
          as: 'building',
          attributes: ['id', 'name', 'is_active']
        }
      ]
    });

    if (!floor) {
      throw new CustomError('Andar não encontrado', 'FLOOR_NOT_FOUND', 404);
    }

    if (req.user.role !== 'admin' && (!floor.is_active || !floor.building.is_active)) {
      throw new CustomError('Andar não encontrado', 'FLOOR_NOT_FOUND', 404);
    }

    // Build where clause
    const whereClause = {
      floor_id: floorId,
      ...(req.user.role !== 'admin' && { is_active: true })
    };

    if (type) {
      whereClause.type = type;
    }

    if (capacity_min) {
      whereClause.capacity = { [Op.gte]: parseInt(capacity_min) };
    }

    if (capacity_max) {
      whereClause.capacity = { 
        ...(whereClause.capacity || {}),
        [Op.lte]: parseInt(capacity_max) 
      };
    }

    if (is_bookable !== undefined) {
      whereClause.is_bookable = is_bookable === 'true';
    }

    let spaces = await models.Space.findAll({
      where: whereClause,
      include: [
        {
          model: models.Floor,
          as: 'floor',
          attributes: ['id', 'name', 'floor_number'],
          include: [
            {
              model: models.Building,
              as: 'building',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['name', 'ASC']]
    });

    // If checking availability at specific time, filter out occupied spaces
    if (available_at) {
      const checkTime = new Date(available_at);
      if (isNaN(checkTime.getTime())) {
        throw new CustomError('Data/hora inválida', 'INVALID_DATETIME', 400);
      }

      const occupiedSpaceIds = await models.Reservation.findAll({
        attributes: ['space_id'],
        where: {
          status: ['confirmed', 'checked_in'],
          start_time: { [Op.lte]: checkTime },
          end_time: { [Op.gt]: checkTime }
        }
      }).then(reservations => reservations.map(r => r.space_id));

      spaces = spaces.filter(space => !occupiedSpaceIds.includes(space.id));
    }

    res.json({
      success: true,
      data: { spaces }
    });
  } catch (error) {
    next(error);
  }
};

const getSpaceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!validateUUID(id)) {
      throw new CustomError('ID do espaço inválido', 'INVALID_SPACE_ID', 400);
    }

    const space = await models.Space.findByPk(id, {
      include: [
        {
          model: models.Floor,
          as: 'floor',
          attributes: ['id', 'name', 'floor_number', 'floor_plan_url'],
          include: [
            {
              model: models.Building,
              as: 'building',
              attributes: ['id', 'name', 'address', 'city']
            }
          ]
        }
      ]
    });

    if (!space) {
      throw new CustomError('Espaço não encontrado', 'SPACE_NOT_FOUND', 404);
    }

    // Check access permissions
    if (req.user.role !== 'admin' && (!space.is_active || !space.floor.building.is_active)) {
      throw new CustomError('Espaço não encontrado', 'SPACE_NOT_FOUND', 404);
    }

    res.json({
      success: true,
      data: { space }
    });
  } catch (error) {
    next(error);
  }
};

const createSpace = async (req, res, next) => {
  try {
    // Only admins can create spaces
    if (req.user.role !== 'admin') {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    const {
      floor_id,
      name,
      type,
      capacity,
      description,
      position,
      equipment,
      amenities,
      booking_rules
    } = req.body;

    if (!floor_id || !name || !type) {
      throw new CustomError(
        'ID do andar, nome e tipo são obrigatórios',
        'MISSING_REQUIRED_FIELDS',
        400
      );
    }

    if (!validateUUID(floor_id)) {
      throw new CustomError('ID do andar inválido', 'INVALID_FLOOR_ID', 400);
    }

    // Check if floor exists
    const floor = await models.Floor.findByPk(floor_id);
    if (!floor) {
      throw new CustomError('Andar não encontrado', 'FLOOR_NOT_FOUND', 404);
    }

    // Validate capacity
    if (capacity && !validateCapacity(capacity)) {
      throw new CustomError('Capacidade deve estar entre 1 e 100', 'INVALID_CAPACITY', 400);
    }

    // Validate position if provided
    if (position && (!validateCoordinates(position.x, position.y) || 
        position.width <= 0 || position.height <= 0)) {
      throw new CustomError('Posição inválida', 'INVALID_POSITION', 400);
    }

    const space = await models.Space.create({
      floor_id,
      name: sanitizeString(name, 100),
      type,
      capacity: capacity || 1,
      description: sanitizeString(description, 1000),
      position: position || { x: 0, y: 0, width: 50, height: 50, rotation: 0 },
      equipment: equipment || {},
      amenities: amenities || {},
      booking_rules: booking_rules || {}
    });

    // Generate QR code for the space
    const qrCodeData = JSON.stringify({
      space_id: space.id,
      type: 'check_in',
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/check-in/${space.id}`
    });

    const qrCode = await QRCode.toDataURL(qrCodeData);
    await space.update({ qr_code: qrCode });

    // Include floor info in response
    const spaceWithFloor = await models.Space.findByPk(space.id, {
      include: [
        {
          model: models.Floor,
          as: 'floor',
          attributes: ['id', 'name', 'floor_number'],
          include: [
            {
              model: models.Building,
              as: 'building',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: { space: spaceWithFloor },
      message: 'Espaço criado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

const updateSpace = async (req, res, next) => {
  try {
    // Only admins can update spaces
    if (req.user.role !== 'admin') {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    const { id } = req.params;

    if (!validateUUID(id)) {
      throw new CustomError('ID do espaço inválido', 'INVALID_SPACE_ID', 400);
    }

    const space = await models.Space.findByPk(id);

    if (!space) {
      throw new CustomError('Espaço não encontrado', 'SPACE_NOT_FOUND', 404);
    }

    const {
      name,
      type,
      capacity,
      description,
      is_active,
      is_bookable,
      position,
      equipment,
      amenities,
      booking_rules
    } = req.body;

    const updates = {};

    if (name) updates.name = sanitizeString(name, 100);
    if (type) updates.type = type;
    if (capacity && validateCapacity(capacity)) updates.capacity = capacity;
    if (description !== undefined) updates.description = sanitizeString(description, 1000);
    if (is_active !== undefined) updates.is_active = Boolean(is_active);
    if (is_bookable !== undefined) updates.is_bookable = Boolean(is_bookable);
    
    if (position) {
      if (validateCoordinates(position.x, position.y) && 
          position.width > 0 && position.height > 0) {
        updates.position = { ...space.position, ...position };
      }
    }

    if (equipment) updates.equipment = { ...space.equipment, ...equipment };
    if (amenities) updates.amenities = { ...space.amenities, ...amenities };
    if (booking_rules) updates.booking_rules = { ...space.booking_rules, ...booking_rules };

    await space.update(updates);

    // Return updated space with floor info
    const updatedSpace = await models.Space.findByPk(id, {
      include: [
        {
          model: models.Floor,
          as: 'floor',
          attributes: ['id', 'name', 'floor_number'],
          include: [
            {
              model: models.Building,
              as: 'building',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    res.json({
      success: true,
      data: { space: updatedSpace },
      message: 'Espaço atualizado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

const deleteSpace = async (req, res, next) => {
  try {
    // Only admins can delete spaces
    if (req.user.role !== 'admin') {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    const { id } = req.params;

    if (!validateUUID(id)) {
      throw new CustomError('ID do espaço inválido', 'INVALID_SPACE_ID', 400);
    }

    const space = await models.Space.findByPk(id);

    if (!space) {
      throw new CustomError('Espaço não encontrado', 'SPACE_NOT_FOUND', 404);
    }

    // Check if space has active reservations
    const activeReservations = await models.Reservation.count({
      where: {
        space_id: id,
        status: ['confirmed', 'checked_in'],
        end_time: { [Op.gt]: new Date() }
      }
    });

    if (activeReservations > 0) {
      throw new CustomError(
        'Não é possível excluir espaço com reservas ativas',
        'SPACE_HAS_ACTIVE_RESERVATIONS',
        400
      );
    }

    await space.destroy();

    res.json({
      success: true,
      message: 'Espaço excluído com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

const getSpaceAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, duration = 60 } = req.query;

    if (!validateUUID(id)) {
      throw new CustomError('ID do espaço inválido', 'INVALID_SPACE_ID', 400);
    }

    const space = await models.Space.findByPk(id);

    if (!space) {
      throw new CustomError('Espaço não encontrado', 'SPACE_NOT_FOUND', 404);
    }

    if (!space.is_active || !space.is_bookable) {
      throw new CustomError('Espaço não disponível para reserva', 'SPACE_NOT_BOOKABLE', 400);
    }

    const checkDate = date ? new Date(date) : new Date();
    if (isNaN(checkDate.getTime())) {
      throw new CustomError('Data inválida', 'INVALID_DATE', 400);
    }

    // Get all reservations for this space on the specified date
    const startOfDay = new Date(checkDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(checkDate);
    endOfDay.setHours(23, 59, 59, 999);

    const reservations = await models.Reservation.findAll({
      where: {
        space_id: id,
        status: ['confirmed', 'checked_in'],
        [Op.or]: [
          {
            start_time: {
              [Op.between]: [startOfDay, endOfDay]
            }
          },
          {
            end_time: {
              [Op.between]: [startOfDay, endOfDay]
            }
          },
          {
            start_time: { [Op.lte]: startOfDay },
            end_time: { [Op.gte]: endOfDay }
          }
        ]
      },
      attributes: ['start_time', 'end_time'],
      order: [['start_time', 'ASC']]
    });

    // Generate availability slots (assuming business hours 8:00-18:00)
    const businessStart = new Date(checkDate);
    businessStart.setHours(8, 0, 0, 0);
    
    const businessEnd = new Date(checkDate);
    businessEnd.setHours(18, 0, 0, 0);

    const slots = [];
    const slotDuration = parseInt(duration);
    
    for (let time = new Date(businessStart); time < businessEnd; time.setMinutes(time.getMinutes() + 30)) {
      const slotStart = new Date(time);
      const slotEnd = new Date(time.getTime() + slotDuration * 60000);
      
      if (slotEnd > businessEnd) break;

      // Check if this slot conflicts with any reservation
      const isAvailable = !reservations.some(reservation => {
        const resStart = new Date(reservation.start_time);
        const resEnd = new Date(reservation.end_time);
        
        return (slotStart < resEnd && slotEnd > resStart);
      });

      slots.push({
        start_time: slotStart,
        end_time: slotEnd,
        available: isAvailable
      });
    }

    res.json({
      success: true,
      data: {
        space_id: id,
        date: checkDate.toISOString().split('T')[0],
        duration: slotDuration,
        slots
      }
    });
  } catch (error) {
    next(error);
  }
};

const regenerateQRCode = async (req, res, next) => {
  try {
    // Only admins can regenerate QR codes
    if (req.user.role !== 'admin') {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    const { id } = req.params;

    if (!validateUUID(id)) {
      throw new CustomError('ID do espaço inválido', 'INVALID_SPACE_ID', 400);
    }

    const space = await models.Space.findByPk(id);

    if (!space) {
      throw new CustomError('Espaço não encontrado', 'SPACE_NOT_FOUND', 404);
    }

    // Generate new QR code
    const qrCodeData = JSON.stringify({
      space_id: space.id,
      type: 'check_in',
      url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/check-in/${space.id}`,
      generated_at: new Date().toISOString()
    });

    const qrCode = await QRCode.toDataURL(qrCodeData);
    await space.update({ qr_code: qrCode });

    res.json({
      success: true,
      data: { qr_code: qrCode },
      message: 'QR Code regenerado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSpaces,
  getSpacesByFloor,
  getSpaceById,
  createSpace,
  updateSpace,
  deleteSpace,
  getSpaceAvailability,
  regenerateQRCode
};
