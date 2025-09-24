const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString()
  });

  // Default error
  let error = {
    message: 'Erro interno do servidor',
    code: 'INTERNAL_ERROR',
    status: 500
  };

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    error = {
      message: 'Dados inválidos',
      code: 'VALIDATION_ERROR',
      status: 400,
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message,
        value: e.value
      }))
    };
  }

  // Sequelize unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    error = {
      message: 'Dados já existem no sistema',
      code: 'DUPLICATE_ERROR',
      status: 409,
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message,
        value: e.value
      }))
    };
  }

  // Sequelize foreign key constraint errors
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    error = {
      message: 'Referência inválida',
      code: 'FOREIGN_KEY_ERROR',
      status: 400
    };
  }

  // Sequelize database connection errors
  if (err.name === 'SequelizeConnectionError') {
    error = {
      message: 'Erro de conexão com o banco de dados',
      code: 'DATABASE_CONNECTION_ERROR',
      status: 503
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Token inválido',
      code: 'INVALID_TOKEN',
      status: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expirado',
      code: 'TOKEN_EXPIRED',
      status: 401
    };
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      message: 'Arquivo muito grande',
      code: 'FILE_TOO_LARGE',
      status: 413
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      message: 'Tipo de arquivo não permitido',
      code: 'INVALID_FILE_TYPE',
      status: 400
    };
  }

  // Custom application errors
  if (err.isCustomError) {
    error = {
      message: err.message,
      code: err.code || 'APPLICATION_ERROR',
      status: err.status || 400,
      details: err.details
    };
  }

  // Rate limiting errors
  if (err.status === 429) {
    error = {
      message: 'Muitas tentativas. Tente novamente em alguns minutos.',
      code: 'RATE_LIMIT_EXCEEDED',
      status: 429
    };
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && error.status === 500) {
    error.message = 'Erro interno do servidor';
    delete error.details;
  }

  res.status(error.status).json({
    success: false,
    error: {
      message: error.message,
      code: error.code,
      ...(error.details && { details: error.details }),
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        originalError: err.message 
      })
    }
  });
};

// Custom error class
class CustomError extends Error {
  constructor(message, code, status = 400, details = null) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.status = status;
    this.details = details;
    this.isCustomError = true;
  }
}

module.exports = {
  errorHandler,
  CustomError
};
