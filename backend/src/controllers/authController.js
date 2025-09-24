const jwt = require('jsonwebtoken');
const { models } = require('../database/connection');
const { CustomError } = require('../middleware/errorHandler');
const { validateEmail, validatePassword } = require('../utils/validation');

const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      throw new CustomError('Email e senha são obrigatórios', 'MISSING_CREDENTIALS', 400);
    }

    if (!validateEmail(email)) {
      throw new CustomError('Email inválido', 'INVALID_EMAIL', 400);
    }

    // Find user
    const user = await models.User.findOne({
      where: { email: email.toLowerCase() },
      include: [
        {
          model: models.Building,
          as: 'building',
          attributes: ['id', 'name', 'is_active']
        }
      ]
    });

    if (!user) {
      throw new CustomError('Credenciais inválidas', 'INVALID_CREDENTIALS', 401);
    }

    if (!user.is_active) {
      throw new CustomError('Conta desativada', 'ACCOUNT_DISABLED', 401);
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      throw new CustomError('Credenciais inválidas', 'INVALID_CREDENTIALS', 401);
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      data: {
        token,
        user: user.toJSON(),
        expires_in: process.env.JWT_EXPIRES_IN || '24h'
      }
    });
  } catch (error) {
    next(error);
  }
};

const register = async (req, res, next) => {
  try {
    const { name, email, password, department, phone, building_id } = req.body;

    // Validate input
    if (!name || !email || !password) {
      throw new CustomError('Nome, email e senha são obrigatórios', 'MISSING_REQUIRED_FIELDS', 400);
    }

    if (!validateEmail(email)) {
      throw new CustomError('Email inválido', 'INVALID_EMAIL', 400);
    }

    if (!validatePassword(password)) {
      throw new CustomError(
        'Senha deve ter pelo menos 6 caracteres',
        'INVALID_PASSWORD',
        400
      );
    }

    // Check if building exists (if provided)
    if (building_id) {
      const building = await models.Building.findByPk(building_id);
      if (!building || !building.is_active) {
        throw new CustomError('Prédio não encontrado ou inativo', 'INVALID_BUILDING', 400);
      }
    }

    // Create user
    const user = await models.User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      department: department?.trim(),
      phone: phone?.trim(),
      building_id,
      role: 'user' // Default role
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: user.toJSON(),
        expires_in: process.env.JWT_EXPIRES_IN || '24h'
      }
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    // User is already authenticated via middleware
    const token = generateToken(req.user.id);

    res.json({
      success: true,
      data: {
        token,
        user: req.user.toJSON(),
        expires_in: process.env.JWT_EXPIRES_IN || '24h'
      }
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await models.User.findByPk(req.user.id, {
      include: [
        {
          model: models.Building,
          as: 'building',
          attributes: ['id', 'name', 'is_active']
        }
      ]
    });

    res.json({
      success: true,
      data: { user: user.toJSON() }
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, department, phone, preferences } = req.body;
    const updates = {};

    if (name) updates.name = name.trim();
    if (department) updates.department = department.trim();
    if (phone) updates.phone = phone.trim();
    if (preferences) updates.preferences = { ...req.user.preferences, ...preferences };

    await req.user.update(updates);

    const updatedUser = await models.User.findByPk(req.user.id, {
      include: [
        {
          model: models.Building,
          as: 'building',
          attributes: ['id', 'name', 'is_active']
        }
      ]
    });

    res.json({
      success: true,
      data: { user: updatedUser.toJSON() }
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new CustomError('Senha atual e nova senha são obrigatórias', 'MISSING_PASSWORDS', 400);
    }

    if (!validatePassword(newPassword)) {
      throw new CustomError(
        'Nova senha deve ter pelo menos 6 caracteres',
        'INVALID_NEW_PASSWORD',
        400
      );
    }

    // Validate current password
    const isValidPassword = await req.user.validatePassword(currentPassword);
    if (!isValidPassword) {
      throw new CustomError('Senha atual incorreta', 'INVALID_CURRENT_PASSWORD', 400);
    }

    // Update password
    await req.user.update({ password: newPassword });

    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    // In a more sophisticated setup, you might want to blacklist the token
    // For now, we'll just return success and let the client handle token removal
    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  logout
};
