const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Reservation = sequelize.define('Reservation', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    space_id: {
      type: DataTypes.UUID,
      allowNull: false
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'),
      defaultValue: 'confirmed',
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    attendees_count: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    is_recurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    recurring_pattern: {
      type: DataTypes.JSONB,
      allowNull: true,
      // Pattern: { type: 'daily|weekly|monthly', interval: 1, days_of_week: [1,2,3], end_date: '2024-12-31' }
    },
    parent_reservation_id: {
      type: DataTypes.UUID,
      allowNull: true
    },
    check_in_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    check_out_time: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancellation_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancelled_by: {
      type: DataTypes.UUID,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {
        source: 'web', // web, mobile, api
        ip_address: null,
        user_agent: null
      }
    }
  }, {
    tableName: 'reservations',
    indexes: [
      {
        fields: ['user_id']
      },
      {
        fields: ['space_id']
      },
      {
        fields: ['start_time']
      },
      {
        fields: ['end_time']
      },
      {
        fields: ['status']
      },
      {
        fields: ['start_time', 'end_time']
      },
      {
        fields: ['space_id', 'start_time', 'end_time']
      },
      {
        fields: ['parent_reservation_id']
      }
    ],
    validate: {
      endTimeAfterStartTime() {
        if (this.end_time <= this.start_time) {
          throw new Error('End time must be after start time');
        }
      }
    }
  });

  return Reservation;
};
