const admin = require('firebase-admin')
const {
  validateUUID,
  firestoreDocToObject,
  firestoreDocsToArray,
  isAdmin
} = require('../utils/validation')

const getReports = async (req, res) => {
  try {
    const userIsAdmin = await isAdmin(req.user.uid)
    if (!userIsAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      })
    }

    const { start_date, end_date, building_id } = req.query

    const startDate = start_date ? new Date(start_date) : new Date()
    startDate.setHours(0, 0, 0, 0)

    const endDate = end_date ? new Date(end_date) : new Date()
    endDate.setHours(23, 59, 59, 999)

    // Buscar reservas no período
    let reservationsQuery = admin
      .firestore()
      .collection('reservations')
      .where('start_time', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .where('start_time', '<=', admin.firestore.Timestamp.fromDate(endDate))

    const reservationsSnapshot = await reservationsQuery.get()
    const reservations = firestoreDocsToArray(reservationsSnapshot.docs)

    // Filtrar por prédio se especificado
    let filteredReservations = reservations
    if (building_id) {
      filteredReservations = []
      for (const reservation of reservations) {
        const spaceDoc = await admin
          .firestore()
          .collection('spaces')
          .doc(reservation.space_id)
          .get()
        if (spaceDoc.exists) {
          const space = spaceDoc.data()
          const floorDoc = await admin
            .firestore()
            .collection('floors')
            .doc(space.floor_id)
            .get()
          if (floorDoc.exists && floorDoc.data().building_id === building_id) {
            filteredReservations.push(reservation)
          }
        }
      }
    }

    // Calcular estatísticas
    const stats = {
      total_reservations: filteredReservations.length,
      confirmed_reservations: filteredReservations.filter(
        r => r.status === 'confirmed'
      ).length,
      checked_in_reservations: filteredReservations.filter(
        r => r.status === 'checked_in'
      ).length,
      completed_reservations: filteredReservations.filter(
        r => r.status === 'completed'
      ).length,
      cancelled_reservations: filteredReservations.filter(
        r => r.status === 'cancelled'
      ).length,
      total_hours: filteredReservations.reduce((total, r) => {
        const duration =
          (r.end_time.toDate() - r.start_time.toDate()) / (1000 * 60 * 60)
        return total + duration
      }, 0)
    }

    res.json({
      success: true,
      data: {
        period: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        },
        stats,
        reservations: filteredReservations
      }
    })
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const getOccupancyReport = async (req, res) => {
  try {
    const userIsAdmin = await isAdmin(req.user.uid)
    if (!userIsAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      })
    }

    const { start_date, end_date, building_id } = req.query

    const startDate = start_date ? new Date(start_date) : new Date()
    startDate.setHours(0, 0, 0, 0)

    const endDate = end_date ? new Date(end_date) : new Date()
    endDate.setHours(23, 59, 59, 999)

    // Buscar todos os espaços reserváveis
    let spacesQuery = admin
      .firestore()
      .collection('spaces')
      .where('is_active', '==', true)
      .where('is_bookable', '==', true)

    const spacesSnapshot = await spacesQuery.get()
    const spaces = firestoreDocsToArray(spacesSnapshot.docs)

    // Filtrar por prédio se especificado
    let filteredSpaces = spaces
    if (building_id) {
      filteredSpaces = []
      for (const space of spaces) {
        const floorDoc = await admin
          .firestore()
          .collection('floors')
          .doc(space.floor_id)
          .get()
        if (floorDoc.exists && floorDoc.data().building_id === building_id) {
          filteredSpaces.push(space)
        }
      }
    }

    // Calcular ocupação por espaço
    const occupancyData = await Promise.all(
      filteredSpaces.map(async space => {
        const reservationsSnapshot = await admin
          .firestore()
          .collection('reservations')
          .where('space_id', '==', space.id)
          .where(
            'start_time',
            '>=',
            admin.firestore.Timestamp.fromDate(startDate)
          )
          .where(
            'start_time',
            '<=',
            admin.firestore.Timestamp.fromDate(endDate)
          )
          .where('status', 'in', ['confirmed', 'checked_in', 'completed'])
          .get()

        const reservations = firestoreDocsToArray(reservationsSnapshot.docs)
        const totalHours = reservations.reduce((total, r) => {
          const duration =
            (r.end_time.toDate() - r.start_time.toDate()) / (1000 * 60 * 60)
          return total + duration
        }, 0)

        const periodHours = (endDate - startDate) / (1000 * 60 * 60)
        const occupancyRate =
          periodHours > 0 ? (totalHours / periodHours) * 100 : 0

        return {
          space_id: space.id,
          space_name: space.name,
          total_reservations: reservations.length,
          total_hours: totalHours,
          occupancy_rate: occupancyRate.toFixed(2)
        }
      })
    )

    res.json({
      success: true,
      data: {
        period: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        },
        occupancy_data: occupancyData
      }
    })
  } catch (error) {
    console.error('Erro ao gerar relatório de ocupação:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const getUserReport = async (req, res) => {
  try {
    const userIsAdmin = await isAdmin(req.user.uid)
    if (!userIsAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      })
    }

    const { start_date, end_date, user_id } = req.query

    const startDate = start_date ? new Date(start_date) : new Date()
    startDate.setHours(0, 0, 0, 0)

    const endDate = end_date ? new Date(end_date) : new Date()
    endDate.setHours(23, 59, 59, 999)

    // Buscar reservas do usuário
    let reservationsQuery = admin
      .firestore()
      .collection('reservations')
      .where('start_time', '>=', admin.firestore.Timestamp.fromDate(startDate))
      .where('start_time', '<=', admin.firestore.Timestamp.fromDate(endDate))

    if (user_id) {
      reservationsQuery = reservationsQuery.where('user_id', '==', user_id)
    }

    const reservationsSnapshot = await reservationsQuery.get()
    const reservations = firestoreDocsToArray(reservationsSnapshot.docs)

    // Agrupar por usuário
    const userStats = {}
    for (const reservation of reservations) {
      const userId = reservation.user_id
      if (!userStats[userId]) {
        userStats[userId] = {
          user_id: userId,
          total_reservations: 0,
          confirmed_reservations: 0,
          checked_in_reservations: 0,
          completed_reservations: 0,
          cancelled_reservations: 0,
          total_hours: 0
        }
      }

      userStats[userId].total_reservations++
      userStats[userId][`${reservation.status}_reservations`]++

      const duration =
        (reservation.end_time.toDate() - reservation.start_time.toDate()) /
        (1000 * 60 * 60)
      userStats[userId].total_hours += duration
    }

    // Enriquecer com dados do usuário
    const enrichedStats = await Promise.all(
      Object.values(userStats).map(async stats => {
        const userDoc = await admin
          .firestore()
          .collection('users')
          .doc(stats.user_id)
          .get()
        const user = userDoc.exists ? firestoreDocToObject(userDoc) : null

        return {
          ...stats,
          user_name: user ? user.name : 'Usuário não encontrado',
          user_email: user ? user.email : null
        }
      })
    )

    res.json({
      success: true,
      data: {
        period: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        },
        user_stats: enrichedStats
      }
    })
  } catch (error) {
    console.error('Erro ao gerar relatório de usuários:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

module.exports = {
  getReports,
  getOccupancyReport,
  getUserReport
}
