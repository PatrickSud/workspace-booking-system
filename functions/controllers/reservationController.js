const admin = require('firebase-admin')
const {
  validateUUID,
  sanitizeString,
  createDocumentWithTimestamp,
  updateDocumentWithTimestamp,
  firestoreDocToObject,
  firestoreDocsToArray,
  isAdmin
} = require('../utils/validation')

const getAllReservations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      user_id,
      space_id,
      start_date,
      end_date
    } = req.query
    const offset = (page - 1) * limit

    let query = admin.firestore().collection('reservations')

    // Aplicar filtros
    if (status) {
      query = query.where('status', '==', status)
    }

    if (user_id) {
      query = query.where('user_id', '==', user_id)
    } else if (req.user.role !== 'admin') {
      // Usuários não-admin só veem suas próprias reservas
      query = query.where('user_id', '==', req.user.uid)
    }

    if (space_id) {
      query = query.where('space_id', '==', space_id)
    }

    if (start_date) {
      query = query.where(
        'start_time',
        '>=',
        admin.firestore.Timestamp.fromDate(new Date(start_date))
      )
    }

    if (end_date) {
      query = query.where(
        'end_time',
        '<=',
        admin.firestore.Timestamp.fromDate(new Date(end_date))
      )
    }

    // Ordenar por data de início
    query = query.orderBy('start_time', 'desc')

    // Paginação
    const snapshot = await query
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get()
    const totalSnapshot = await admin
      .firestore()
      .collection('reservations')
      .get()

    const reservations = firestoreDocsToArray(snapshot.docs)

    // Enriquecer com dados relacionados
    const enrichedReservations = await Promise.all(
      reservations.map(async reservation => {
        // Buscar dados do espaço
        const spaceDoc = await admin
          .firestore()
          .collection('spaces')
          .doc(reservation.space_id)
          .get()
        let space = null
        if (spaceDoc.exists) {
          space = firestoreDocToObject(spaceDoc)

          // Buscar dados do andar
          const floorDoc = await admin
            .firestore()
            .collection('floors')
            .doc(space.floor_id)
            .get()
          if (floorDoc.exists) {
            space.floor = firestoreDocToObject(floorDoc)

            // Buscar dados do prédio
            const buildingDoc = await admin
              .firestore()
              .collection('buildings')
              .doc(space.floor.building_id)
              .get()
            if (buildingDoc.exists) {
              space.floor.building = firestoreDocToObject(buildingDoc)
            }
          }
        }

        // Buscar dados do usuário
        const userDoc = await admin
          .firestore()
          .collection('users')
          .doc(reservation.user_id)
          .get()
        const user = userDoc.exists ? firestoreDocToObject(userDoc) : null

        return {
          ...reservation,
          space,
          user
        }
      })
    )

    res.json({
      success: true,
      data: {
        reservations: enrichedReservations,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalSnapshot.size / limit),
          total_items: totalSnapshot.size,
          items_per_page: parseInt(limit)
        }
      }
    })
  } catch (error) {
    console.error('Erro ao buscar reservas:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const getReservationById = async (req, res) => {
  try {
    const { id } = req.params

    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID da reserva inválido'
      })
    }

    const reservationDoc = await admin
      .firestore()
      .collection('reservations')
      .doc(id)
      .get()

    if (!reservationDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Reserva não encontrada'
      })
    }

    const reservation = firestoreDocToObject(reservationDoc)

    // Verificar se usuário pode ver esta reserva
    if (req.user.role !== 'admin' && reservation.user_id !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      })
    }

    // Enriquecer com dados relacionados
    const spaceDoc = await admin
      .firestore()
      .collection('spaces')
      .doc(reservation.space_id)
      .get()
    let space = null
    if (spaceDoc.exists) {
      space = firestoreDocToObject(spaceDoc)

      const floorDoc = await admin
        .firestore()
        .collection('floors')
        .doc(space.floor_id)
        .get()
      if (floorDoc.exists) {
        space.floor = firestoreDocToObject(floorDoc)

        const buildingDoc = await admin
          .firestore()
          .collection('buildings')
          .doc(space.floor.building_id)
          .get()
        if (buildingDoc.exists) {
          space.floor.building = firestoreDocToObject(buildingDoc)
        }
      }
    }

    const userDoc = await admin
      .firestore()
      .collection('users')
      .doc(reservation.user_id)
      .get()
    const user = userDoc.exists ? firestoreDocToObject(userDoc) : null

    res.json({
      success: true,
      data: {
        reservation: {
          ...reservation,
          space,
          user
        }
      }
    })
  } catch (error) {
    console.error('Erro ao buscar reserva:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const createReservation = async (req, res) => {
  try {
    const {
      space_id,
      start_time,
      end_time,
      title,
      description,
      attendees_count = 1
    } = req.body

    if (!space_id || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        error: 'ID do espaço, data/hora de início e fim são obrigatórios'
      })
    }

    // Verificar se o espaço existe e está ativo
    const spaceDoc = await admin
      .firestore()
      .collection('spaces')
      .doc(space_id)
      .get()
    if (!spaceDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Espaço não encontrado'
      })
    }

    const space = firestoreDocToObject(spaceDoc)
    if (!space.is_active || !space.is_bookable) {
      return res.status(400).json({
        success: false,
        error: 'Espaço não está disponível para reserva'
      })
    }

    const startTime = new Date(start_time)
    const endTime = new Date(end_time)

    // Validar datas
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        error: 'Data/hora de início deve ser anterior à data/hora de fim'
      })
    }

    if (startTime <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível fazer reservas para datas passadas'
      })
    }

    // Verificar conflitos de horário
    const conflictingReservations = await admin
      .firestore()
      .collection('reservations')
      .where('space_id', '==', space_id)
      .where('status', 'in', ['confirmed', 'checked_in'])
      .get()

    for (const reservationDoc of conflictingReservations.docs) {
      const reservation = reservationDoc.data()
      const existingStart = reservation.start_time.toDate()
      const existingEnd = reservation.end_time.toDate()

      if (startTime < existingEnd && endTime > existingStart) {
        return res.status(400).json({
          success: false,
          error: 'Já existe uma reserva neste horário'
        })
      }
    }

    // Verificar limite de reservas simultâneas do usuário
    const userReservationsSnapshot = await admin
      .firestore()
      .collection('reservations')
      .where('user_id', '==', req.user.uid)
      .where('status', 'in', ['confirmed', 'checked_in'])
      .where('start_time', '<=', admin.firestore.Timestamp.fromDate(endTime))
      .where('end_time', '>=', admin.firestore.Timestamp.fromDate(startTime))
      .get()

    if (userReservationsSnapshot.size >= 3) {
      // Limite de 3 reservas simultâneas
      return res.status(400).json({
        success: false,
        error: 'Limite de reservas simultâneas excedido'
      })
    }

    const reservationData = createDocumentWithTimestamp({
      user_id: req.user.uid,
      space_id: space_id,
      start_time: admin.firestore.Timestamp.fromDate(startTime),
      end_time: admin.firestore.Timestamp.fromDate(endTime),
      title: sanitizeString(title, 200) || 'Reserva',
      description: sanitizeString(description, 1000),
      attendees_count: parseInt(attendees_count),
      status: 'confirmed',
      created_by: req.user.uid
    })

    const docRef = await admin
      .firestore()
      .collection('reservations')
      .add(reservationData)
    const reservation = { id: docRef.id, ...reservationData }

    res.status(201).json({
      success: true,
      data: { reservation },
      message: 'Reserva criada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar reserva:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const updateReservation = async (req, res) => {
  try {
    const { id } = req.params

    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID da reserva inválido'
      })
    }

    const reservationDoc = await admin
      .firestore()
      .collection('reservations')
      .doc(id)
      .get()

    if (!reservationDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Reserva não encontrada'
      })
    }

    const reservation = firestoreDocToObject(reservationDoc)

    // Verificar se usuário pode editar esta reserva
    if (req.user.role !== 'admin' && reservation.user_id !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      })
    }

    // Verificar se reserva pode ser editada
    if (
      reservation.status === 'cancelled' ||
      reservation.status === 'completed'
    ) {
      return res.status(400).json({
        success: false,
        error: 'Reserva não pode ser editada'
      })
    }

    const { start_time, end_time, title, description, attendees_count } =
      req.body

    const updates = updateDocumentWithTimestamp({})

    if (start_time) {
      const startTime = new Date(start_time)
      if (startTime <= new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Não é possível alterar para datas passadas'
        })
      }
      updates.start_time = admin.firestore.Timestamp.fromDate(startTime)
    }

    if (end_time) {
      const endTime = new Date(end_time)
      updates.end_time = admin.firestore.Timestamp.fromDate(endTime)
    }

    if (title) updates.title = sanitizeString(title, 200)
    if (description !== undefined)
      updates.description = sanitizeString(description, 1000)
    if (attendees_count) updates.attendees_count = parseInt(attendees_count)

    await admin.firestore().collection('reservations').doc(id).update(updates)

    const updatedDoc = await admin
      .firestore()
      .collection('reservations')
      .doc(id)
      .get()
    const updatedReservation = firestoreDocToObject(updatedDoc)

    res.json({
      success: true,
      data: { reservation: updatedReservation },
      message: 'Reserva atualizada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar reserva:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const cancelReservation = async (req, res) => {
  try {
    const { id } = req.params

    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID da reserva inválido'
      })
    }

    const reservationDoc = await admin
      .firestore()
      .collection('reservations')
      .doc(id)
      .get()

    if (!reservationDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Reserva não encontrada'
      })
    }

    const reservation = firestoreDocToObject(reservationDoc)

    // Verificar se usuário pode cancelar esta reserva
    if (req.user.role !== 'admin' && reservation.user_id !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      })
    }

    // Verificar se reserva pode ser cancelada
    if (reservation.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Reserva já foi cancelada'
      })
    }

    if (reservation.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Reserva já foi concluída'
      })
    }

    const updates = updateDocumentWithTimestamp({
      status: 'cancelled',
      cancelled_at: admin.firestore.Timestamp.now(),
      cancelled_by: req.user.uid
    })

    await admin.firestore().collection('reservations').doc(id).update(updates)

    res.json({
      success: true,
      message: 'Reserva cancelada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao cancelar reserva:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const checkIn = async (req, res) => {
  try {
    const { id } = req.params

    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID da reserva inválido'
      })
    }

    const reservationDoc = await admin
      .firestore()
      .collection('reservations')
      .doc(id)
      .get()

    if (!reservationDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Reserva não encontrada'
      })
    }

    const reservation = firestoreDocToObject(reservationDoc)

    // Verificar se usuário pode fazer check-in
    if (req.user.role !== 'admin' && reservation.user_id !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      })
    }

    // Verificar se reserva pode ter check-in
    if (reservation.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        error: 'Reserva não está confirmada'
      })
    }

    const now = new Date()
    const startTime = reservation.start_time
    const checkInWindow = 15 // 15 minutos antes

    if (now < new Date(startTime.getTime() - checkInWindow * 60000)) {
      return res.status(400).json({
        success: false,
        error: 'Check-in só pode ser feito até 15 minutos antes do horário'
      })
    }

    if (now > reservation.end_time) {
      return res.status(400).json({
        success: false,
        error: 'Horário da reserva já passou'
      })
    }

    const updates = updateDocumentWithTimestamp({
      status: 'checked_in',
      checked_in_at: admin.firestore.Timestamp.now(),
      checked_in_by: req.user.uid
    })

    await admin.firestore().collection('reservations').doc(id).update(updates)

    // Criar registro de check-in
    const checkInData = createDocumentWithTimestamp({
      reservation_id: id,
      user_id: reservation.user_id,
      space_id: reservation.space_id,
      checked_in_at: admin.firestore.Timestamp.now(),
      checked_in_by: req.user.uid
    })

    await admin.firestore().collection('checkins').add(checkInData)

    res.json({
      success: true,
      message: 'Check-in realizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao fazer check-in:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const checkOut = async (req, res) => {
  try {
    const { id } = req.params

    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID da reserva inválido'
      })
    }

    const reservationDoc = await admin
      .firestore()
      .collection('reservations')
      .doc(id)
      .get()

    if (!reservationDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Reserva não encontrada'
      })
    }

    const reservation = firestoreDocToObject(reservationDoc)

    // Verificar se usuário pode fazer check-out
    if (req.user.role !== 'admin' && reservation.user_id !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      })
    }

    // Verificar se reserva pode ter check-out
    if (reservation.status !== 'checked_in') {
      return res.status(400).json({
        success: false,
        error: 'Reserva não está com check-in realizado'
      })
    }

    const updates = updateDocumentWithTimestamp({
      status: 'completed',
      checked_out_at: admin.firestore.Timestamp.now(),
      checked_out_by: req.user.uid
    })

    await admin.firestore().collection('reservations').doc(id).update(updates)

    res.json({
      success: true,
      message: 'Check-out realizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao fazer check-out:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

module.exports = {
  getAllReservations,
  getReservationById,
  createReservation,
  updateReservation,
  cancelReservation,
  checkIn,
  checkOut
}
