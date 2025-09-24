const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Space = sequelize.define('Space', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    floor_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    type: {
      type: DataTypes.ENUM('workstation', 'meeting_room', 'phone_booth', 'lounge', 'other'),
      allowNull: false,
      defaultValue: 'workstation'
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 100
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    is_bookable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    position: {
      type: DataTypes.JSONB,
      defaultValue: {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        rotation: 0
      }
    },
    equipment: {
      type: DataTypes.JSONB,
      defaultValue: {
        monitor: false,
        keyboard: false,
        mouse: false,
        webcam: false,
        headset: false,
        projector: false,
        whiteboard: false,
        tv: false,
        phone: false,
        other: []
      }
    },
    amenities: {
      type: DataTypes.JSONB,
      defaultValue: {
        near_window: false,
        near_kitchen: false,
        near_bathroom: false,
        quiet_zone: false,
        collaboration_zone: false,
        standing_desk: false,
        ergonomic_chair: false,
        power_outlets: 2,
        natural_light: false,
        air_conditioning: true
      }
    },
    booking_rules: {
      type: DataTypes.JSONB,
      defaultValue: {
        min_duration_minutes: 30,
        max_duration_minutes: 480,
        advance_booking_days: 30,
        requires_approval: false,
        auto_release_minutes: 15
      }
    },
    qr_code: {
      type: DataTypes.STRING,
      allowNull: true
    },
    image_urls: {
      type: DataTypes.JSONB,
      defaultValue: []
    }
  }, {
    tableName: 'spaces',
    indexes: [
      {
        fields: ['floor_id']
      },
      {
        fields: ['type']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['is_bookable']
      },
      {
        fields: ['capacity']
      }
    ]
  });

  return Space;
};
