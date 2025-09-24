require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Import database
const { sequelize } = require('./database/connection');

// Import routes
const authRoutes = require('./routes/auth');
const buildingRoutes = require('./routes/buildings');
const floorRoutes = require('./routes/floors');
const spaceRoutes = require('./routes/spaces');
const reservationRoutes = require('./routes/reservations');
const userRoutes = require('./routes/users');
const reportRoutes = require('./routes/reports');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

// Import socket handlers
const socketHandler = require('./services/socketService');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3004", 
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3004",
      "http://127.0.0.1:58712", // Current browser preview
      /^http:\/\/127\.0\.0\.1:\d+$/,
      process.env.FRONTEND_URL
    ].filter(Boolean),
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Muitas tentativas. Tente novamente em alguns minutos.'
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(limiter);
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3004", 
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3004",
    "http://127.0.0.1:58712", // Current browser preview
    /^http:\/\/127\.0\.0\.1:\d+$/, // Allow any port on 127.0.0.1 for browser preview
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/buildings', authenticateToken, buildingRoutes);
app.use('/api/floors', authenticateToken, floorRoutes);
app.use('/api/spaces', authenticateToken, spaceRoutes);
app.use('/api/reservations', authenticateToken, reservationRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Endpoint não encontrado' });
});

// Error handling middleware
app.use(errorHandler);

// Socket.IO connection handling
socketHandler(io);

// Database connection and server start
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso.');
    
    // Sync database models
    await sequelize.sync({ alter: true });
    console.log('✅ Modelos do banco de dados sincronizados.');
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 Recebido SIGTERM. Encerrando servidor graciosamente...');
  server.close(() => {
    console.log('✅ Servidor encerrado.');
    sequelize.close();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('🔄 Recebido SIGINT. Encerrando servidor graciosamente...');
  server.close(() => {
    console.log('✅ Servidor encerrado.');
    sequelize.close();
    process.exit(0);
  });
});

startServer();

module.exports = { app, server, io };
