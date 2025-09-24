const { models } = require('../database/connection');
const { CustomError } = require('../middleware/errorHandler');
const { validateUUID, sanitizeString } = require('../utils/validation');
const { Op } = require('sequelize');

const getAllBuildings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, is_active } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { city: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }

    // Non-admin users can only see active buildings
    if (req.user.role !== 'admin') {
      whereClause.is_active = true;
    }

    const { count, rows: buildings } = await models.Building.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: models.Floor,
          as: 'floors',
          attributes: ['id', 'name', 'floor_number'],
          where: { is_active: true },
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        buildings,
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

const getBuildingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!validateUUID(id)) {
      throw new CustomError('ID do prédio inválido', 'INVALID_BUILDING_ID', 400);
    }

    const building = await models.Building.findByPk(id, {
      include: [
        {
          model: models.Floor,
          as: 'floors',
          include: [
            {
              model: models.Space,
              as: 'spaces',
              attributes: ['id', 'name', 'type', 'capacity', 'is_active', 'is_bookable']
            }
          ]
        }
      ]
    });

    if (!building) {
      throw new CustomError('Prédio não encontrado', 'BUILDING_NOT_FOUND', 404);
    }

    // Non-admin users can only see active buildings
    if (req.user.role !== 'admin' && !building.is_active) {
      throw new CustomError('Prédio não encontrado', 'BUILDING_NOT_FOUND', 404);
    }

    res.json({
      success: true,
      data: { building }
    });
  } catch (error) {
    next(error);
  }
};

const createBuilding = async (req, res, next) => {
  try {
    // Only admins can create buildings
    if (req.user.role !== 'admin') {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    const {
      name,
      address,
      city,
      state,
      zip_code,
      country,
      description,
      settings,
      contact_info
    } = req.body;

    if (!name || !address || !city || !state) {
      throw new CustomError(
        'Nome, endereço, cidade e estado são obrigatórios',
        'MISSING_REQUIRED_FIELDS',
        400
      );
    }

    const building = await models.Building.create({
      name: sanitizeString(name, 100),
      address: sanitizeString(address, 500),
      city: sanitizeString(city, 100),
      state: sanitizeString(state, 100),
      zip_code: sanitizeString(zip_code, 20),
      country: sanitizeString(country, 100) || 'Brasil',
      description: sanitizeString(description, 1000),
      settings: settings || {},
      contact_info: contact_info || {}
    });

    res.status(201).json({
      success: true,
      data: { building },
      message: 'Prédio criado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

const updateBuilding = async (req, res, next) => {
  try {
    // Only admins can update buildings
    if (req.user.role !== 'admin') {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    const { id } = req.params;

    if (!validateUUID(id)) {
      throw new CustomError('ID do prédio inválido', 'INVALID_BUILDING_ID', 400);
    }

    const building = await models.Building.findByPk(id);

    if (!building) {
      throw new CustomError('Prédio não encontrado', 'BUILDING_NOT_FOUND', 404);
    }

    const {
      name,
      address,
      city,
      state,
      zip_code,
      country,
      description,
      is_active,
      settings,
      contact_info
    } = req.body;

    const updates = {};

    if (name) updates.name = sanitizeString(name, 100);
    if (address) updates.address = sanitizeString(address, 500);
    if (city) updates.city = sanitizeString(city, 100);
    if (state) updates.state = sanitizeString(state, 100);
    if (zip_code) updates.zip_code = sanitizeString(zip_code, 20);
    if (country) updates.country = sanitizeString(country, 100);
    if (description !== undefined) updates.description = sanitizeString(description, 1000);
    if (is_active !== undefined) updates.is_active = Boolean(is_active);
    if (settings) updates.settings = { ...building.settings, ...settings };
    if (contact_info) updates.contact_info = { ...building.contact_info, ...contact_info };

    await building.update(updates);

    res.json({
      success: true,
      data: { building },
      message: 'Prédio atualizado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

const deleteBuilding = async (req, res, next) => {
  try {
    // Only admins can delete buildings
    if (req.user.role !== 'admin') {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    const { id } = req.params;

    if (!validateUUID(id)) {
      throw new CustomError('ID do prédio inválido', 'INVALID_BUILDING_ID', 400);
    }

    const building = await models.Building.findByPk(id);

    if (!building) {
      throw new CustomError('Prédio não encontrado', 'BUILDING_NOT_FOUND', 404);
    }

    // Check if building has active reservations
    const activeReservations = await models.Reservation.count({
      include: [
        {
          model: models.Space,
          as: 'space',
          include: [
            {
              model: models.Floor,
              as: 'floor',
              where: { building_id: id }
            }
          ]
        }
      ],
      where: {
        status: ['confirmed', 'checked_in'],
        end_time: { [Op.gt]: new Date() }
      }
    });

    if (activeReservations > 0) {
      throw new CustomError(
        'Não é possível excluir prédio com reservas ativas',
        'BUILDING_HAS_ACTIVE_RESERVATIONS',
        400
      );
    }

    await building.destroy();

    res.json({
      success: true,
      message: 'Prédio excluído com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

const getBuildingStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!validateUUID(id)) {
      throw new CustomError('ID do prédio inválido', 'INVALID_BUILDING_ID', 400);
    }

    const building = await models.Building.findByPk(id);

    if (!building) {
      throw new CustomError('Prédio não encontrado', 'BUILDING_NOT_FOUND', 404);
    }

    // Non-admin users can only see stats for active buildings
    if (req.user.role !== 'admin' && !building.is_active) {
      throw new CustomError('Prédio não encontrado', 'BUILDING_NOT_FOUND', 404);
    }

    // Get building statistics
    const stats = await Promise.all([
      // Total floors
      models.Floor.count({
        where: { building_id: id, is_active: true }
      }),
      
      // Total spaces
      models.Space.count({
        include: [
          {
            model: models.Floor,
            as: 'floor',
            where: { building_id: id, is_active: true }
          }
        ],
        where: { is_active: true }
      }),
      
      // Total bookable spaces
      models.Space.count({
        include: [
          {
            model: models.Floor,
            as: 'floor',
            where: { building_id: id, is_active: true }
          }
        ],
        where: { is_active: true, is_bookable: true }
      }),
      
      // Active reservations today
      models.Reservation.count({
        include: [
          {
            model: models.Space,
            as: 'space',
            include: [
              {
                model: models.Floor,
                as: 'floor',
                where: { building_id: id }
              }
            ]
          }
        ],
        where: {
          status: ['confirmed', 'checked_in'],
          start_time: {
            [Op.gte]: new Date().setHours(0, 0, 0, 0),
            [Op.lt]: new Date().setHours(23, 59, 59, 999)
          }
        }
      })
    ]);

    const [totalFloors, totalSpaces, bookableSpaces, activeReservationsToday] = stats;

    res.json({
      success: true,
      data: {
        building_id: id,
        stats: {
          total_floors: totalFloors,
          total_spaces: totalSpaces,
          bookable_spaces: bookableSpaces,
          active_reservations_today: activeReservationsToday,
          occupancy_rate: bookableSpaces > 0 ? (activeReservationsToday / bookableSpaces * 100).toFixed(2) : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  getBuildingStats
};
