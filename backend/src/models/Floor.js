const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Floor = sequelize.define('Floor', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    building_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 50]
      }
    },
    floor_number: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    floor_plan_url: {
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
        capacity: 0,
        amenities: [],
        emergency_info: {
          exits: [],
          assembly_point: '',
          emergency_contact: ''
        }
      }
    }
  }, {
    tableName: 'floors',
    indexes: [
      {
        unique: true,
        fields: ['building_id', 'floor_number']
      },
      {
        fields: ['building_id']
      },
      {
        fields: ['is_active']
      }
    ]
  });

  return Floor;
};
