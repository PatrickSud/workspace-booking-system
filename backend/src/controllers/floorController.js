const { models } = require('../database/connection');
const { CustomError } = require('../middleware/errorHandler');
const { validateUUID, sanitizeString } = require('../utils/validation');
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');

// Configure multer for floor plan uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/floor-plans/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'floor-plan-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas (JPEG, PNG, GIF, SVG)'));
    }
  }
});

const getFloors = async (req, res, next) => {
  try {
    const { 
      building_id, 
      include_spaces = false, 
      is_active = true 
    } = req.query;

    // Build where conditions
    const whereConditions = {};
    
    if (building_id && validateUUID(building_id)) {
      whereConditions.building_id = building_id;
    }
    
    if (is_active !== undefined) {
      whereConditions.is_active = is_active === 'true';
    }

    // Build include array
    const includeArray = [
      {
        model: models.Building,
        as: 'building',
        attributes: ['id', 'name', 'address', 'is_active']
      }
    ];

    if (include_spaces === 'true') {
      includeArray.push({
        model: models.Space,
        as: 'spaces',
        attributes: ['id', 'name', 'type', 'capacity', 'is_active', 'is_bookable'],
        where: { is_active: true },
        required: false
      });
    }

    const floors = await models.Floor.findAll({
      where: whereConditions,
      include: includeArray,
      order: [
        ['building', 'name'],
        ['floor_number']
      ]
    });

    res.json({
      success: true,
      data: {
        floors,
        total: floors.length
      }
    });
  } catch (error) {
    next(error);
  }
};

const getFloorsByBuilding = async (req, res, next) => {
  try {
    const { buildingId } = req.params;
    const { include_spaces = false } = req.query;

    if (!validateUUID(buildingId)) {
      throw new CustomError('ID do prédio inválido', 'INVALID_BUILDING_ID', 400);
    }

    // Check if building exists and user has access
    const building = await models.Building.findByPk(buildingId);
    if (!building) {
      throw new CustomError('Prédio não encontrado', 'BUILDING_NOT_FOUND', 404);
    }

    if (req.user.role !== 'admin' && !building.is_active) {
      throw new CustomError('Prédio não encontrado', 'BUILDING_NOT_FOUND', 404);
    }

    const includeOptions = [
      {
        model: models.Building,
        as: 'building',
        attributes: ['id', 'name', 'is_active']
      }
    ];

    if (include_spaces === 'true') {
      includeOptions.push({
        model: models.Space,
        as: 'spaces',
        attributes: ['id', 'name', 'type', 'capacity', 'is_active', 'is_bookable', 'position'],
        where: req.user.role === 'admin' ? {} : { is_active: true },
        required: false
      });
    }

    const floors = await models.Floor.findAll({
      where: {
        building_id: buildingId,
        ...(req.user.role !== 'admin' && { is_active: true })
      },
      include: includeOptions,
      order: [['floor_number', 'ASC']]
    });

    res.json({
      success: true,
      data: { floors }
    });
  } catch (error) {
    next(error);
  }
};

const getFloorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!validateUUID(id)) {
      throw new CustomError('ID do andar inválido', 'INVALID_FLOOR_ID', 400);
    }

    const floor = await models.Floor.findByPk(id, {
      include: [
        {
          model: models.Building,
          as: 'building',
          attributes: ['id', 'name', 'is_active']
        },
        {
          model: models.Space,
          as: 'spaces',
          attributes: ['id', 'name', 'type', 'capacity', 'is_active', 'is_bookable', 'position', 'equipment', 'amenities'],
          where: req.user.role === 'admin' ? {} : { is_active: true },
          required: false
        }
      ]
    });

    if (!floor) {
      throw new CustomError('Andar não encontrado', 'FLOOR_NOT_FOUND', 404);
    }

    // Check access permissions
    if (req.user.role !== 'admin' && (!floor.is_active || !floor.building.is_active)) {
      throw new CustomError('Andar não encontrado', 'FLOOR_NOT_FOUND', 404);
    }

    res.json({
      success: true,
      data: { floor }
    });
  } catch (error) {
    next(error);
  }
};

const createFloor = async (req, res, next) => {
  try {
    // Only admins can create floors
    if (req.user.role !== 'admin') {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    const { building_id, name, floor_number, description, settings } = req.body;

    if (!building_id || !name || floor_number === undefined) {
      throw new CustomError(
        'ID do prédio, nome e número do andar são obrigatórios',
        'MISSING_REQUIRED_FIELDS',
        400
      );
    }

    if (!validateUUID(building_id)) {
      throw new CustomError('ID do prédio inválido', 'INVALID_BUILDING_ID', 400);
    }

    // Check if building exists
    const building = await models.Building.findByPk(building_id);
    if (!building) {
      throw new CustomError('Prédio não encontrado', 'BUILDING_NOT_FOUND', 404);
    }

    // Check if floor number already exists in this building
    const existingFloor = await models.Floor.findOne({
      where: { building_id, floor_number: parseInt(floor_number) }
    });

    if (existingFloor) {
      throw new CustomError(
        'Já existe um andar com este número neste prédio',
        'FLOOR_NUMBER_EXISTS',
        400
      );
    }

    const floor = await models.Floor.create({
      building_id,
      name: sanitizeString(name, 50),
      floor_number: parseInt(floor_number),
      description: sanitizeString(description, 1000),
      settings: settings || {}
    });

    // Include building info in response
    const floorWithBuilding = await models.Floor.findByPk(floor.id, {
      include: [
        {
          model: models.Building,
          as: 'building',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: { floor: floorWithBuilding },
      message: 'Andar criado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

const updateFloor = async (req, res, next) => {
  try {
    // Only admins can update floors
    if (req.user.role !== 'admin') {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    const { id } = req.params;

    if (!validateUUID(id)) {
      throw new CustomError('ID do andar inválido', 'INVALID_FLOOR_ID', 400);
    }

    const floor = await models.Floor.findByPk(id);

    if (!floor) {
      throw new CustomError('Andar não encontrado', 'FLOOR_NOT_FOUND', 404);
    }

    const { name, floor_number, description, is_active, settings } = req.body;

    const updates = {};

    if (name) updates.name = sanitizeString(name, 50);
    if (description !== undefined) updates.description = sanitizeString(description, 1000);
    if (is_active !== undefined) updates.is_active = Boolean(is_active);
    if (settings) updates.settings = { ...floor.settings, ...settings };

    // Handle floor number change
    if (floor_number !== undefined && parseInt(floor_number) !== floor.floor_number) {
      // Check if new floor number already exists in this building
      const existingFloor = await models.Floor.findOne({
        where: { 
          building_id: floor.building_id, 
          floor_number: parseInt(floor_number),
          id: { [Op.ne]: id }
        }
      });

      if (existingFloor) {
        throw new CustomError(
          'Já existe um andar com este número neste prédio',
          'FLOOR_NUMBER_EXISTS',
          400
        );
      }

      updates.floor_number = parseInt(floor_number);
    }

    await floor.update(updates);

    // Return updated floor with building info
    const updatedFloor = await models.Floor.findByPk(id, {
      include: [
        {
          model: models.Building,
          as: 'building',
          attributes: ['id', 'name']
        }
      ]
    });

    res.json({
      success: true,
      data: { floor: updatedFloor },
      message: 'Andar atualizado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

const deleteFloor = async (req, res, next) => {
  try {
    // Only admins can delete floors
    if (req.user.role !== 'admin') {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    const { id } = req.params;

    if (!validateUUID(id)) {
      throw new CustomError('ID do andar inválido', 'INVALID_FLOOR_ID', 400);
    }

    const floor = await models.Floor.findByPk(id);

    if (!floor) {
      throw new CustomError('Andar não encontrado', 'FLOOR_NOT_FOUND', 404);
    }

    // Check if floor has active reservations
    const activeReservations = await models.Reservation.count({
      include: [
        {
          model: models.Space,
          as: 'space',
          where: { floor_id: id }
        }
      ],
      where: {
        status: ['confirmed', 'checked_in'],
        end_time: { [Op.gt]: new Date() }
      }
    });

    if (activeReservations > 0) {
      throw new CustomError(
        'Não é possível excluir andar com reservas ativas',
        'FLOOR_HAS_ACTIVE_RESERVATIONS',
        400
      );
    }

    await floor.destroy();

    res.json({
      success: true,
      message: 'Andar excluído com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

const uploadFloorPlan = async (req, res, next) => {
  try {
    // Only admins can upload floor plans
    if (req.user.role !== 'admin') {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    const { id } = req.params;

    if (!validateUUID(id)) {
      throw new CustomError('ID do andar inválido', 'INVALID_FLOOR_ID', 400);
    }

    const floor = await models.Floor.findByPk(id);

    if (!floor) {
      throw new CustomError('Andar não encontrado', 'FLOOR_NOT_FOUND', 404);
    }

    if (!req.file) {
      throw new CustomError('Nenhum arquivo foi enviado', 'NO_FILE_UPLOADED', 400);
    }

    const floor_plan_url = `/uploads/floor-plans/${req.file.filename}`;

    await floor.update({ floor_plan_url });

    res.json({
      success: true,
      data: { 
        floor_plan_url,
        message: 'Planta baixa enviada com sucesso'
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFloors,
  getFloorsByBuilding,
  getFloorById,
  createFloor,
  updateFloor,
  deleteFloor,
  uploadFloorPlan,
  upload
};
