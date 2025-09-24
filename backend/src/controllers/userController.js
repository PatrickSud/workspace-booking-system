const { models } = require('../database/connection');
const { CustomError } = require('../middleware/errorHandler');
const { validateUUID, validateEmail, sanitizeString } = require('../utils/validation');
const { Op } = require('sequelize');

const getAllUsers = async (req, res, next) => {
  try {
    // Only admins can view all users
    if (req.user.role !== 'admin') {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    const { page = 1, limit = 10, search, role, building_id, is_active } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { department: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (role) {
      whereClause.role = role;
    }

    if (building_id) {
      if (!validateUUID(building_id)) {
        throw new CustomError('ID do prédio inválido', 'INVALID_BUILDING_ID', 400);
      }
      whereClause.building_id = building_id;
    }

    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }

    const { count, rows: users } = await models.User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: models.Building,
          as: 'building',
          attributes: ['id', 'name', 'city'],
          required: false
        }
      ],
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        users,
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

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!validateUUID(id)) {
      throw new CustomError('ID do usuário inválido', 'INVALID_USER_ID', 400);
    }

    // Users can only view their own profile, admins can view any
    if (req.user.role !== 'admin' && req.user.id !== id) {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    const user = await models.User.findByPk(id, {
      include: [
        {
          model: models.Building,
          as: 'building',
          attributes: ['id', 'name', 'address', 'city']
        }
      ],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      throw new CustomError('Usuário não encontrado', 'USER_NOT_FOUND', 404);
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    // Only admins can create users
    if (req.user.role !== 'admin') {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    const { name, email, password, role, department, phone, building_id } = req.body;

    if (!name || !email || !password) {
      throw new CustomError(
        'Nome, email e senha são obrigatórios',
        'MISSING_REQUIRED_FIELDS',
        400
      );
    }

    if (!validateEmail(email)) {
      throw new CustomError('Email inválido', 'INVALID_EMAIL', 400);
    }

    if (password.length < 6) {
      throw new CustomError('Senha deve ter pelo menos 6 caracteres', 'INVALID_PASSWORD', 400);
    }

    if (building_id && !validateUUID(building_id)) {
      throw new CustomError('ID do prédio inválido', 'INVALID_BUILDING_ID', 400);
    }

    // Check if building exists
    if (building_id) {
      const building = await models.Building.findByPk(building_id);
      if (!building) {
        throw new CustomError('Prédio não encontrado', 'BUILDING_NOT_FOUND', 404);
      }
    }

    const user = await models.User.create({
      name: sanitizeString(name, 100),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'user',
      department: sanitizeString(department, 100),
      phone: sanitizeString(phone, 20),
      building_id
    });

    // Get user with building info
    const userWithBuilding = await models.User.findByPk(user.id, {
      include: [
        {
          model: models.Building,
          as: 'building',
          attributes: ['id', 'name']
        }
      ],
      attributes: { exclude: ['password'] }
    });

    res.status(201).json({
      success: true,
      data: { user: userWithBuilding },
      message: 'Usuário criado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!validateUUID(id)) {
      throw new CustomError('ID do usuário inválido', 'INVALID_USER_ID', 400);
    }

    // Users can only update their own profile, admins can update any
    if (req.user.role !== 'admin' && req.user.id !== id) {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    const user = await models.User.findByPk(id);

    if (!user) {
      throw new CustomError('Usuário não encontrado', 'USER_NOT_FOUND', 404);
    }

    const { name, email, role, department, phone, building_id, is_active, preferences } = req.body;

    const updates = {};

    if (name) updates.name = sanitizeString(name, 100);
    if (department !== undefined) updates.department = sanitizeString(department, 100);
    if (phone !== undefined) updates.phone = sanitizeString(phone, 20);
    if (preferences) updates.preferences = { ...user.preferences, ...preferences };

    // Only admins can update these fields
    if (req.user.role === 'admin') {
      if (email && validateEmail(email)) {
        updates.email = email.toLowerCase().trim();
      }
      if (role) updates.role = role;
      if (is_active !== undefined) updates.is_active = Boolean(is_active);
      
      if (building_id !== undefined) {
        if (building_id && !validateUUID(building_id)) {
          throw new CustomError('ID do prédio inválido', 'INVALID_BUILDING_ID', 400);
        }
        
        if (building_id) {
          const building = await models.Building.findByPk(building_id);
          if (!building) {
            throw new CustomError('Prédio não encontrado', 'BUILDING_NOT_FOUND', 404);
          }
        }
        
        updates.building_id = building_id;
      }
    }

    await user.update(updates);

    // Get updated user with building info
    const updatedUser = await models.User.findByPk(id, {
      include: [
        {
          model: models.Building,
          as: 'building',
          attributes: ['id', 'name']
        }
      ],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      data: { user: updatedUser },
      message: 'Usuário atualizado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    // Only admins can delete users
    if (req.user.role !== 'admin') {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    const { id } = req.params;

    if (!validateUUID(id)) {
      throw new CustomError('ID do usuário inválido', 'INVALID_USER_ID', 400);
    }

    // Can't delete yourself
    if (req.user.id === id) {
      throw new CustomError('Não é possível excluir sua própria conta', 'CANNOT_DELETE_SELF', 400);
    }

    const user = await models.User.findByPk(id);

    if (!user) {
      throw new CustomError('Usuário não encontrado', 'USER_NOT_FOUND', 404);
    }

    // Check if user has active reservations
    const activeReservations = await models.Reservation.count({
      where: {
        user_id: id,
        status: ['confirmed', 'checked_in'],
        end_time: { [Op.gt]: new Date() }
      }
    });

    if (activeReservations > 0) {
      throw new CustomError(
        'Não é possível excluir usuário com reservas ativas',
        'USER_HAS_ACTIVE_RESERVATIONS',
        400
      );
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'Usuário excluído com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

const getUserStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!validateUUID(id)) {
      throw new CustomError('ID do usuário inválido', 'INVALID_USER_ID', 400);
    }

    // Users can only view their own stats, admins can view any
    if (req.user.role !== 'admin' && req.user.id !== id) {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    const user = await models.User.findByPk(id);

    if (!user) {
      throw new CustomError('Usuário não encontrado', 'USER_NOT_FOUND', 404);
    }

    // Get user statistics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = await Promise.all([
      // Total reservations
      models.Reservation.count({
        where: { user_id: id }
      }),
      
      // Active reservations
      models.Reservation.count({
        where: {
          user_id: id,
          status: ['confirmed', 'checked_in'],
          end_time: { [Op.gt]: now }
        }
      }),
      
      // Completed reservations
      models.Reservation.count({
        where: {
          user_id: id,
          status: 'completed'
        }
      }),
      
      // Cancelled reservations
      models.Reservation.count({
        where: {
          user_id: id,
          status: 'cancelled'
        }
      }),
      
      // No-show reservations
      models.Reservation.count({
        where: {
          user_id: id,
          status: 'no_show'
        }
      }),
      
      // Reservations in last 30 days
      models.Reservation.count({
        where: {
          user_id: id,
          created_at: { [Op.gte]: thirtyDaysAgo }
        }
      }),
      
      // Check-ins count
      models.CheckIn.count({
        where: { user_id: id }
      }),
      
      // Most used space type
      models.Reservation.findAll({
        attributes: [
          [models.sequelize.col('space.type'), 'space_type'],
          [models.sequelize.fn('COUNT', models.sequelize.col('Reservation.id')), 'count']
        ],
        include: [
          {
            model: models.Space,
            as: 'space',
            attributes: []
          }
        ],
        where: { user_id: id },
        group: ['space.type'],
        order: [[models.sequelize.fn('COUNT', models.sequelize.col('Reservation.id')), 'DESC']],
        limit: 1,
        raw: true
      })
    ]);

    const [
      totalReservations,
      activeReservations,
      completedReservations,
      cancelledReservations,
      noShowReservations,
      recentReservations,
      totalCheckIns,
      mostUsedSpaceType
    ] = stats;

    const checkInRate = totalReservations > 0 ? ((totalCheckIns / totalReservations) * 100).toFixed(2) : 0;
    const cancellationRate = totalReservations > 0 ? ((cancelledReservations / totalReservations) * 100).toFixed(2) : 0;
    const noShowRate = totalReservations > 0 ? ((noShowReservations / totalReservations) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        user_id: id,
        stats: {
          total_reservations: totalReservations,
          active_reservations: activeReservations,
          completed_reservations: completedReservations,
          cancelled_reservations: cancelledReservations,
          no_show_reservations: noShowReservations,
          recent_reservations: recentReservations,
          total_check_ins: totalCheckIns,
          check_in_rate: parseFloat(checkInRate),
          cancellation_rate: parseFloat(cancellationRate),
          no_show_rate: parseFloat(noShowRate),
          most_used_space_type: mostUsedSpaceType.length > 0 ? mostUsedSpaceType[0].space_type : null
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const resetUserPassword = async (req, res, next) => {
  try {
    // Only admins can reset passwords
    if (req.user.role !== 'admin') {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    const { id } = req.params;
    const { new_password } = req.body;

    if (!validateUUID(id)) {
      throw new CustomError('ID do usuário inválido', 'INVALID_USER_ID', 400);
    }

    if (!new_password || new_password.length < 6) {
      throw new CustomError('Nova senha deve ter pelo menos 6 caracteres', 'INVALID_PASSWORD', 400);
    }

    const user = await models.User.findByPk(id);

    if (!user) {
      throw new CustomError('Usuário não encontrado', 'USER_NOT_FOUND', 404);
    }

    await user.update({ password: new_password });

    res.json({
      success: true,
      message: 'Senha redefinida com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  resetUserPassword
};
