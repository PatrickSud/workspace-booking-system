const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Building = sequelize.define('Building', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false
    },
    zip_code: {
      type: DataTypes.STRING,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING,
      defaultValue: 'Brasil'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {
        business_hours: {
          monday: { start: '08:00', end: '18:00', enabled: true },
          tuesday: { start: '08:00', end: '18:00', enabled: true },
          wednesday: { start: '08:00', end: '18:00', enabled: true },
          thursday: { start: '08:00', end: '18:00', enabled: true },
          friday: { start: '08:00', end: '18:00', enabled: true },
          saturday: { start: '08:00', end: '12:00', enabled: false },
          sunday: { start: '08:00', end: '12:00', enabled: false }
        },
        booking_rules: {
          max_advance_days: 30,
          min_duration_minutes: 30,
          max_duration_minutes: 480,
          max_concurrent_bookings: 3,
          check_in_window_minutes: 15
        },
        amenities: []
      }
    },
    contact_info: {
      type: DataTypes.JSONB,
      defaultValue: {
        phone: '',
        email: '',
        manager: ''
      }
    }
  }, {
    tableName: 'buildings',
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['city']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  return Building;
};
