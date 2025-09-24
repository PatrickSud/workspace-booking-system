const jwt = require('jsonwebtoken');
const { models } = require('../database/connection');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Token de acesso requerido',
        code: 'NO_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist and are active
    const user = await models.User.findByPk(decoded.userId, {
      include: [
        {
          model: models.Building,
          as: 'building',
          attributes: ['id', 'name', 'is_active']
        }
      ]
    });

    if (!user) {
      return res.status(401).json({ 
        message: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({ 
        message: 'Conta desativada',
        code: 'ACCOUNT_DISABLED'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Acesso negado. Privilégios de administrador requeridos.',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
};

const requireSelfOrAdmin = (req, res, next) => {
  const targetUserId = req.params.userId || req.params.id;
  
  if (req.user.role === 'admin' || req.user.id === targetUserId) {
    return next();
  }
  
  return res.status(403).json({ 
    message: 'Acesso negado. Você só pode acessar seus próprios dados.',
    code: 'ACCESS_DENIED'
  });
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await models.User.findByPk(decoded.userId);

    if (user && user.is_active) {
      req.user = user;
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireSelfOrAdmin,
  optionalAuth
};
