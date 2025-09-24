const { models } = require('../database/connection');
const { CustomError } = require('../middleware/errorHandler');
const { validateUUID } = require('../utils/validation');
const { Op } = require('sequelize');
const moment = require('moment');

const getOccupancyReport = async (req, res, next) => {
  try {
    // Only admins can access reports
    if (req.user.role !== 'admin') {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    const { 
      building_id, 
      floor_id, 
      start_date, 
      end_date, 
      group_by = 'day' // day, week, month
    } = req.query;

    // Default to last 30 days if no dates provided
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date ? new Date(start_date) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (startDate >= endDate) {
      throw new CustomError('Data de início deve ser anterior à data de fim', 'INVALID_DATE_RANGE', 400);
    }

    // Build include conditions
    const spaceInclude = {
      model: models.Space,
      as: 'space',
      attributes: ['id', 'name', 'type', 'capacity'],
      include: [
        {
          model: models.Floor,
          as: 'floor',
          attributes: ['id', 'name', 'floor_number'],
          include: [
            {
              model: models.Building,
              as: 'building',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    };

    // Apply filters
    if (building_id) {
      if (!validateUUID(building_id)) {
        throw new CustomError('ID do prédio inválido', 'INVALID_BUILDING_ID', 400);
      }
      spaceInclude.include[0].include[0].where = { id: building_id };
    }

    if (floor_id) {
      if (!validateUUID(floor_id)) {
        throw new CustomError('ID do andar inválido', 'INVALID_FLOOR_ID', 400);
      }
      spaceInclude.include[0].where = { id: floor_id };
    }

    // Get reservations in date range
    const reservations = await models.Reservation.findAll({
      where: {
        status: ['confirmed', 'checked_in', 'completed'],
        start_time: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        }
      },
      include: [spaceInclude],
      attributes: ['id', 'start_time', 'end_time', 'status'],
      order: [['start_time', 'ASC']]
    });

    // Get total available spaces for the period
    const totalSpaces = await models.Space.count({
      include: [
        {
          model: models.Floor,
          as: 'floor',
          ...(floor_id && { where: { id: floor_id } }),
          include: [
            {
              model: models.Building,
              as: 'building',
              ...(building_id && { where: { id: building_id } })
            }
          ]
        }
      ],
      where: { is_active: true, is_bookable: true }
    });

    // Group data by specified period
    const groupedData = {};
    const dateFormat = group_by === 'day' ? 'YYYY-MM-DD' : 
                      group_by === 'week' ? 'YYYY-[W]WW' : 'YYYY-MM';

    reservations.forEach(reservation => {
      const key = moment(reservation.start_time).format(dateFormat);
      
      if (!groupedData[key]) {
        groupedData[key] = {
          period: key,
          total_reservations: 0,
          total_hours: 0,
          unique_spaces: new Set(),
          by_space_type: {},
          by_building: {},
          by_floor: {}
        };
      }

      const duration = moment(reservation.end_time).diff(moment(reservation.start_time), 'hours', true);
      const spaceType = reservation.space.type;
      const buildingName = reservation.space.floor.building.name;
      const floorName = reservation.space.floor.name;

      groupedData[key].total_reservations++;
      groupedData[key].total_hours += duration;
      groupedData[key].unique_spaces.add(reservation.space.id);

      // Group by space type
      if (!groupedData[key].by_space_type[spaceType]) {
        groupedData[key].by_space_type[spaceType] = { count: 0, hours: 0 };
      }
      groupedData[key].by_space_type[spaceType].count++;
      groupedData[key].by_space_type[spaceType].hours += duration;

      // Group by building
      if (!groupedData[key].by_building[buildingName]) {
        groupedData[key].by_building[buildingName] = { count: 0, hours: 0 };
      }
      groupedData[key].by_building[buildingName].count++;
      groupedData[key].by_building[buildingName].hours += duration;

      // Group by floor
      if (!groupedData[key].by_floor[floorName]) {
        groupedData[key].by_floor[floorName] = { count: 0, hours: 0 };
      }
      groupedData[key].by_floor[floorName].count++;
      groupedData[key].by_floor[floorName].hours += duration;
    });

    // Convert to array and calculate occupancy rates
    const reportData = Object.values(groupedData).map(period => {
      const uniqueSpacesCount = period.unique_spaces.size;
      const occupancyRate = totalSpaces > 0 ? (uniqueSpacesCount / totalSpaces * 100).toFixed(2) : 0;

      return {
        period: period.period,
        total_reservations: period.total_reservations,
        total_hours: Math.round(period.total_hours * 100) / 100,
        unique_spaces_used: uniqueSpacesCount,
        occupancy_rate: parseFloat(occupancyRate),
        by_space_type: period.by_space_type,
        by_building: period.by_building,
        by_floor: period.by_floor
      };
    });

    res.json({
      success: true,
      data: {
        report_type: 'occupancy',
        period: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          group_by
        },
        filters: {
          building_id: building_id || null,
          floor_id: floor_id || null
        },
        summary: {
          total_spaces: totalSpaces,
          total_reservations: reservations.length,
          total_hours: Math.round(reservations.reduce((sum, r) => 
            sum + moment(r.end_time).diff(moment(r.start_time), 'hours', true), 0) * 100) / 100
        },
        data: reportData
      }
    });
  } catch (error) {
    next(error);
  }
};

const getUsageReport = async (req, res, next) => {
  try {
    // Only admins can access reports
    if (req.user.role !== 'admin') {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    const { 
      building_id, 
      start_date, 
      end_date,
      top_users = 10,
      top_spaces = 10
    } = req.query;

    // Default to last 30 days if no dates provided
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date ? new Date(start_date) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Build where clause for reservations
    const reservationWhere = {
      status: ['confirmed', 'checked_in', 'completed'],
      start_time: {
        [Op.gte]: startDate,
        [Op.lte]: endDate
      }
    };

    // Build include for building filter
    const spaceInclude = {
      model: models.Space,
      as: 'space',
      attributes: ['id', 'name', 'type'],
      include: [
        {
          model: models.Floor,
          as: 'floor',
          attributes: ['id', 'name'],
          include: [
            {
              model: models.Building,
              as: 'building',
              attributes: ['id', 'name'],
              ...(building_id && { where: { id: building_id } })
            }
          ]
        }
      ]
    };

    // Top users by reservation count
    const topUsers = await models.Reservation.findAll({
      attributes: [
        [models.sequelize.col('user.id'), 'user_id'],
        [models.sequelize.col('user.name'), 'user_name'],
        [models.sequelize.col('user.department'), 'department'],
        [models.sequelize.fn('COUNT', models.sequelize.col('Reservation.id')), 'reservation_count'],
        [models.sequelize.fn('SUM', 
          models.sequelize.literal('EXTRACT(EPOCH FROM (end_time - start_time))/3600')
        ), 'total_hours']
      ],
      include: [
        {
          model: models.User,
          as: 'user',
          attributes: []
        },
        spaceInclude
      ],
      where: reservationWhere,
      group: ['user.id', 'user.name', 'user.department'],
      order: [[models.sequelize.fn('COUNT', models.sequelize.col('Reservation.id')), 'DESC']],
      limit: parseInt(top_users),
      raw: true
    });

    // Top spaces by reservation count
    const topSpaces = await models.Reservation.findAll({
      attributes: [
        [models.sequelize.col('space.id'), 'space_id'],
        [models.sequelize.col('space.name'), 'space_name'],
        [models.sequelize.col('space.type'), 'space_type'],
        [models.sequelize.col('space.floor.building.name'), 'building_name'],
        [models.sequelize.col('space.floor.name'), 'floor_name'],
        [models.sequelize.fn('COUNT', models.sequelize.col('Reservation.id')), 'reservation_count'],
        [models.sequelize.fn('SUM', 
          models.sequelize.literal('EXTRACT(EPOCH FROM (end_time - start_time))/3600')
        ), 'total_hours']
      ],
      include: [spaceInclude],
      where: reservationWhere,
      group: [
        'space.id', 'space.name', 'space.type', 
        'space.floor.building.name', 'space.floor.name'
      ],
      order: [[models.sequelize.fn('COUNT', models.sequelize.col('Reservation.id')), 'DESC']],
      limit: parseInt(top_spaces),
      raw: true
    });

    // Usage by space type
    const usageByType = await models.Reservation.findAll({
      attributes: [
        [models.sequelize.col('space.type'), 'space_type'],
        [models.sequelize.fn('COUNT', models.sequelize.col('Reservation.id')), 'reservation_count'],
        [models.sequelize.fn('SUM', 
          models.sequelize.literal('EXTRACT(EPOCH FROM (end_time - start_time))/3600')
        ), 'total_hours']
      ],
      include: [spaceInclude],
      where: reservationWhere,
      group: ['space.type'],
      order: [[models.sequelize.fn('COUNT', models.sequelize.col('Reservation.id')), 'DESC']],
      raw: true
    });

    // Usage by hour of day
    const usageByHour = await models.Reservation.findAll({
      attributes: [
        [models.sequelize.fn('EXTRACT', models.sequelize.literal('HOUR FROM start_time')), 'hour'],
        [models.sequelize.fn('COUNT', models.sequelize.col('Reservation.id')), 'reservation_count']
      ],
      include: [spaceInclude],
      where: reservationWhere,
      group: [models.sequelize.fn('EXTRACT', models.sequelize.literal('HOUR FROM start_time'))],
      order: [[models.sequelize.fn('EXTRACT', models.sequelize.literal('HOUR FROM start_time')), 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      data: {
        report_type: 'usage',
        period: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        },
        filters: {
          building_id: building_id || null
        },
        top_users: topUsers.map(user => ({
          user_id: user.user_id,
          name: user.user_name,
          department: user.department,
          reservation_count: parseInt(user.reservation_count),
          total_hours: Math.round(parseFloat(user.total_hours || 0) * 100) / 100
        })),
        top_spaces: topSpaces.map(space => ({
          space_id: space.space_id,
          name: space.space_name,
          type: space.space_type,
          building: space.building_name,
          floor: space.floor_name,
          reservation_count: parseInt(space.reservation_count),
          total_hours: Math.round(parseFloat(space.total_hours || 0) * 100) / 100
        })),
        usage_by_type: usageByType.map(type => ({
          space_type: type.space_type,
          reservation_count: parseInt(type.reservation_count),
          total_hours: Math.round(parseFloat(type.total_hours || 0) * 100) / 100
        })),
        usage_by_hour: usageByHour.map(hour => ({
          hour: parseInt(hour.hour),
          reservation_count: parseInt(hour.reservation_count)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

const getNoShowReport = async (req, res, next) => {
  try {
    // Only admins can access reports
    if (req.user.role !== 'admin') {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    const { 
      building_id, 
      start_date, 
      end_date,
      user_id
    } = req.query;

    // Default to last 30 days if no dates provided
    const endDate = end_date ? new Date(end_date) : new Date();
    const startDate = start_date ? new Date(start_date) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Build where clause
    const whereClause = {
      status: 'no_show',
      start_time: {
        [Op.gte]: startDate,
        [Op.lte]: endDate
      }
    };

    if (user_id) {
      if (!validateUUID(user_id)) {
        throw new CustomError('ID do usuário inválido', 'INVALID_USER_ID', 400);
      }
      whereClause.user_id = user_id;
    }

    // Build include for building filter
    const spaceInclude = {
      model: models.Space,
      as: 'space',
      attributes: ['id', 'name', 'type'],
      include: [
        {
          model: models.Floor,
          as: 'floor',
          attributes: ['id', 'name'],
          include: [
            {
              model: models.Building,
              as: 'building',
              attributes: ['id', 'name'],
              ...(building_id && { where: { id: building_id } })
            }
          ]
        }
      ]
    };

    // Get no-show reservations
    const noShowReservations = await models.Reservation.findAll({
      where: whereClause,
      include: [
        {
          model: models.User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'department']
        },
        spaceInclude
      ],
      order: [['start_time', 'DESC']]
    });

    // No-show statistics by user
    const noShowByUser = await models.Reservation.findAll({
      attributes: [
        [models.sequelize.col('user.id'), 'user_id'],
        [models.sequelize.col('user.name'), 'user_name'],
        [models.sequelize.col('user.email'), 'user_email'],
        [models.sequelize.col('user.department'), 'department'],
        [models.sequelize.fn('COUNT', models.sequelize.col('Reservation.id')), 'no_show_count']
      ],
      include: [
        {
          model: models.User,
          as: 'user',
          attributes: []
        },
        spaceInclude
      ],
      where: whereClause,
      group: ['user.id', 'user.name', 'user.email', 'user.department'],
      order: [[models.sequelize.fn('COUNT', models.sequelize.col('Reservation.id')), 'DESC']],
      raw: true
    });

    // No-show statistics by space
    const noShowBySpace = await models.Reservation.findAll({
      attributes: [
        [models.sequelize.col('space.id'), 'space_id'],
        [models.sequelize.col('space.name'), 'space_name'],
        [models.sequelize.col('space.type'), 'space_type'],
        [models.sequelize.col('space.floor.building.name'), 'building_name'],
        [models.sequelize.fn('COUNT', models.sequelize.col('Reservation.id')), 'no_show_count']
      ],
      include: [spaceInclude],
      where: whereClause,
      group: [
        'space.id', 'space.name', 'space.type', 
        'space.floor.building.name'
      ],
      order: [[models.sequelize.fn('COUNT', models.sequelize.col('Reservation.id')), 'DESC']],
      raw: true
    });

    // Calculate overall no-show rate
    const totalReservationsInPeriod = await models.Reservation.count({
      include: [spaceInclude],
      where: {
        start_time: {
          [Op.gte]: startDate,
          [Op.lte]: endDate
        },
        ...(user_id && { user_id })
      }
    });

    const noShowRate = totalReservationsInPeriod > 0 ? 
      (noShowReservations.length / totalReservationsInPeriod * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        report_type: 'no_show',
        period: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        },
        filters: {
          building_id: building_id || null,
          user_id: user_id || null
        },
        summary: {
          total_no_shows: noShowReservations.length,
          total_reservations: totalReservationsInPeriod,
          no_show_rate: parseFloat(noShowRate)
        },
        no_show_reservations: noShowReservations,
        no_show_by_user: noShowByUser.map(user => ({
          user_id: user.user_id,
          name: user.user_name,
          email: user.user_email,
          department: user.department,
          no_show_count: parseInt(user.no_show_count)
        })),
        no_show_by_space: noShowBySpace.map(space => ({
          space_id: space.space_id,
          name: space.space_name,
          type: space.space_type,
          building: space.building_name,
          no_show_count: parseInt(space.no_show_count)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    // Only admins can access dashboard stats
    if (req.user.role !== 'admin') {
      throw new CustomError('Acesso negado', 'ACCESS_DENIED', 403);
    }

    const { building_id } = req.query;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const thisWeekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Build include for building filter
    const spaceInclude = building_id ? {
      model: models.Space,
      as: 'space',
      include: [
        {
          model: models.Floor,
          as: 'floor',
          include: [
            {
              model: models.Building,
              as: 'building',
              where: { id: building_id }
            }
          ]
        }
      ]
    } : undefined;

    const buildingInclude = building_id ? {
      model: models.Floor,
      as: 'floors',
      include: [
        {
          model: models.Building,
          as: 'building',
          where: { id: building_id }
        }
      ]
    } : undefined;

    // Get dashboard statistics
    const stats = await Promise.all([
      // Total active spaces
      models.Space.count({
        where: { is_active: true, is_bookable: true },
        ...(buildingInclude && { include: [buildingInclude] })
      }),
      
      // Total active users
      models.User.count({
        where: { is_active: true }
      }),
      
      // Active reservations right now
      models.Reservation.count({
        where: {
          status: ['confirmed', 'checked_in'],
          start_time: { [Op.lte]: now },
          end_time: { [Op.gt]: now }
        },
        ...(spaceInclude && { include: [spaceInclude] })
      }),
      
      // Reservations today
      models.Reservation.count({
        where: {
          start_time: {
            [Op.gte]: today,
            [Op.lt]: tomorrow
          }
        },
        ...(spaceInclude && { include: [spaceInclude] })
      }),
      
      // Reservations this week
      models.Reservation.count({
        where: {
          start_time: { [Op.gte]: thisWeekStart }
        },
        ...(spaceInclude && { include: [spaceInclude] })
      }),
      
      // Reservations this month
      models.Reservation.count({
        where: {
          start_time: { [Op.gte]: thisMonthStart }
        },
        ...(spaceInclude && { include: [spaceInclude] })
      }),
      
      // No-shows this month
      models.Reservation.count({
        where: {
          status: 'no_show',
          start_time: { [Op.gte]: thisMonthStart }
        },
        ...(spaceInclude && { include: [spaceInclude] })
      }),
      
      // Check-ins today
      models.CheckIn.count({
        where: {
          check_in_time: {
            [Op.gte]: today,
            [Op.lt]: tomorrow
          }
        }
      })
    ]);

    const [
      totalSpaces,
      totalUsers,
      activeReservationsNow,
      reservationsToday,
      reservationsThisWeek,
      reservationsThisMonth,
      noShowsThisMonth,
      checkInsToday
    ] = stats;

    // Calculate occupancy rate
    const occupancyRate = totalSpaces > 0 ? 
      (activeReservationsNow / totalSpaces * 100).toFixed(2) : 0;

    // Calculate check-in rate for today
    const checkInRateToday = reservationsToday > 0 ? 
      (checkInsToday / reservationsToday * 100).toFixed(2) : 0;

    // Calculate no-show rate for this month
    const noShowRateThisMonth = reservationsThisMonth > 0 ? 
      (noShowsThisMonth / reservationsThisMonth * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        total_spaces: totalSpaces,
        total_users: totalUsers,
        active_reservations_now: activeReservationsNow,
        occupancy_rate: parseFloat(occupancyRate),
        reservations: {
          today: reservationsToday,
          this_week: reservationsThisWeek,
          this_month: reservationsThisMonth
        },
        check_ins: {
          today: checkInsToday,
          rate_today: parseFloat(checkInRateToday)
        },
        no_shows: {
          this_month: noShowsThisMonth,
          rate_this_month: parseFloat(noShowRateThisMonth)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOccupancyReport,
  getUsageReport,
  getNoShowReport,
  getDashboardStats
};
