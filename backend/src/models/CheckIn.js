const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CheckIn = sequelize.define('CheckIn', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    reservation_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    check_in_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    check_out_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    method: {
      type: DataTypes.ENUM('qr_code', 'manual', 'auto'),
      defaultValue: 'qr_code',
      allowNull: false
    },
    location: {
      type: DataTypes.JSONB,
      allowNull: true,
      // GPS coordinates if available
    },
    device_info: {
      type: DataTypes.JSONB,
      defaultValue: {
        user_agent: null,
        ip_address: null,
        device_type: null
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'check_ins',
    indexes: [
      {
        unique: true,
        fields: ['reservation_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['check_in_time']
      },
      {
        fields: ['method']
      }
    ]
  });

  return CheckIn;
};
