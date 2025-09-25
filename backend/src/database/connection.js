const { Sequelize } = require('sequelize')

// Database configuration
const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'workspace_booking',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
})

// Import models
const User = require('../models/User')(sequelize)
const Building = require('../models/Building')(sequelize)
const Floor = require('../models/Floor')(sequelize)
const Space = require('../models/Space')(sequelize)
const Reservation = require('../models/Reservation')(sequelize)
const CheckIn = require('../models/CheckIn')(sequelize)

// Define associations
const models = {
  User,
  Building,
  Floor,
  Space,
  Reservation,
  CheckIn
}

// User associations
User.hasMany(Reservation, { foreignKey: 'user_id', as: 'reservations' })
User.hasMany(CheckIn, { foreignKey: 'user_id', as: 'checkIns' })
User.belongsTo(Building, { foreignKey: 'building_id', as: 'building' })

// Building associations
Building.hasMany(Floor, {
  foreignKey: 'building_id',
  as: 'floors',
  onDelete: 'CASCADE'
})
Building.hasMany(User, { foreignKey: 'building_id', as: 'users' })

// Floor associations
Floor.belongsTo(Building, { foreignKey: 'building_id', as: 'building' })
Floor.hasMany(Space, {
  foreignKey: 'floor_id',
  as: 'spaces',
  onDelete: 'CASCADE'
})

// Space associations
Space.belongsTo(Floor, { foreignKey: 'floor_id', as: 'floor' })
Space.hasMany(Reservation, {
  foreignKey: 'space_id',
  as: 'reservations',
  onDelete: 'CASCADE'
})

// Reservation associations
Reservation.belongsTo(User, { foreignKey: 'user_id', as: 'user' })
Reservation.belongsTo(Space, { foreignKey: 'space_id', as: 'space' })
Reservation.hasOne(CheckIn, { foreignKey: 'reservation_id', as: 'checkIn' })

// CheckIn associations
CheckIn.belongsTo(User, { foreignKey: 'user_id', as: 'user' })
CheckIn.belongsTo(Reservation, {
  foreignKey: 'reservation_id',
  as: 'reservation'
})

module.exports = {
  sequelize,
  models
}
