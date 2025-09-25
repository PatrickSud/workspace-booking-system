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

const getAllBuildings = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, is_active } = req.query
    const offset = (page - 1) * limit

    let query = admin.firestore().collection('buildings')

    // Aplicar filtros
    if (is_active !== undefined) {
      query = query.where('is_active', '==', is_active === 'true')
    } else if (req.user.role !== 'admin') {
      // Usuários não-admin só veem prédios ativos
      query = query.where('is_active', '==', true)
    }

    // Busca textual (simplificada - Firestore não tem busca full-text nativa)
    if (search) {
      // Para busca mais avançada, seria necessário usar Algolia ou similar
      // Por enquanto, vamos buscar por nome que começa com o termo
      query = query
        .where('name', '>=', search)
        .where('name', '<=', search + '\uf8ff')
    }

    // Ordenar por nome
    query = query.orderBy('name', 'asc')

    // Paginação
    const snapshot = await query
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get()
    const totalSnapshot = await admin.firestore().collection('buildings').get()

    const buildings = firestoreDocsToArray(snapshot.docs)

    // Para cada prédio, buscar os andares ativos
    const buildingsWithFloors = await Promise.all(
      buildings.map(async building => {
        const floorsSnapshot = await admin
          .firestore()
          .collection('floors')
          .where('building_id', '==', building.id)
          .where('is_active', '==', true)
          .get()

        const floors = firestoreDocsToArray(floorsSnapshot.docs)
        return { ...building, floors }
      })
    )

    res.json({
      success: true,
      data: {
        buildings: buildingsWithFloors,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalSnapshot.size / limit),
          total_items: totalSnapshot.size,
          items_per_page: parseInt(limit)
        }
      }
    })
  } catch (error) {
    console.error('Erro ao buscar prédios:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const getBuildingById = async (req, res) => {
  try {
    const { id } = req.params

    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID do prédio inválido'
      })
    }

    const buildingDoc = await admin
      .firestore()
      .collection('buildings')
      .doc(id)
      .get()

    if (!buildingDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Prédio não encontrado'
      })
    }

    const building = firestoreDocToObject(buildingDoc)

    // Verificar se usuário não-admin pode ver este prédio
    if (req.user.role !== 'admin' && !building.is_active) {
      return res.status(404).json({
        success: false,
        error: 'Prédio não encontrado'
      })
    }

    // Buscar andares do prédio
    const floorsSnapshot = await admin
      .firestore()
      .collection('floors')
      .where('building_id', '==', id)
      .get()

    const floors = await Promise.all(
      firestoreDocsToArray(floorsSnapshot.docs).map(async floor => {
        // Para cada andar, buscar espaços
        const spacesSnapshot = await admin
          .firestore()
          .collection('spaces')
          .where('floor_id', '==', floor.id)
          .get()

        const spaces = firestoreDocsToArray(spacesSnapshot.docs)
        return { ...floor, spaces }
      })
    )

    res.json({
      success: true,
      data: { building: { ...building, floors } }
    })
  } catch (error) {
    console.error('Erro ao buscar prédio:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const createBuilding = async (req, res) => {
  try {
    // Verificar se usuário é admin
    const userIsAdmin = await isAdmin(req.user.uid)
    if (!userIsAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      })
    }

    const {
      name,
      address,
      city,
      state,
      zip_code,
      country,
      description,
      settings,
      contact_info
    } = req.body

    if (!name || !address || !city || !state) {
      return res.status(400).json({
        success: false,
        error: 'Nome, endereço, cidade e estado são obrigatórios'
      })
    }

    const buildingData = createDocumentWithTimestamp({
      name: sanitizeString(name, 100),
      address: sanitizeString(address, 500),
      city: sanitizeString(city, 100),
      state: sanitizeString(state, 100),
      zip_code: sanitizeString(zip_code, 20),
      country: sanitizeString(country, 100) || 'Brasil',
      description: sanitizeString(description, 1000),
      is_active: true,
      settings: settings || {
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
      },
      contact_info: contact_info || {
        phone: '',
        email: '',
        manager: ''
      }
    })

    const docRef = await admin
      .firestore()
      .collection('buildings')
      .add(buildingData)
    const building = { id: docRef.id, ...buildingData }

    res.status(201).json({
      success: true,
      data: { building },
      message: 'Prédio criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar prédio:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const updateBuilding = async (req, res) => {
  try {
    // Verificar se usuário é admin
    const userIsAdmin = await isAdmin(req.user.uid)
    if (!userIsAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      })
    }

    const { id } = req.params

    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID do prédio inválido'
      })
    }

    const buildingDoc = await admin
      .firestore()
      .collection('buildings')
      .doc(id)
      .get()

    if (!buildingDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Prédio não encontrado'
      })
    }

    const {
      name,
      address,
      city,
      state,
      zip_code,
      country,
      description,
      is_active,
      settings,
      contact_info
    } = req.body

    const updates = updateDocumentWithTimestamp({})

    if (name) updates.name = sanitizeString(name, 100)
    if (address) updates.address = sanitizeString(address, 500)
    if (city) updates.city = sanitizeString(city, 100)
    if (state) updates.state = sanitizeString(state, 100)
    if (zip_code) updates.zip_code = sanitizeString(zip_code, 20)
    if (country) updates.country = sanitizeString(country, 100)
    if (description !== undefined)
      updates.description = sanitizeString(description, 1000)
    if (is_active !== undefined) updates.is_active = Boolean(is_active)
    if (settings) {
      const currentData = buildingDoc.data()
      updates.settings = { ...currentData.settings, ...settings }
    }
    if (contact_info) {
      const currentData = buildingDoc.data()
      updates.contact_info = { ...currentData.contact_info, ...contact_info }
    }

    await admin.firestore().collection('buildings').doc(id).update(updates)

    const updatedDoc = await admin
      .firestore()
      .collection('buildings')
      .doc(id)
      .get()
    const building = firestoreDocToObject(updatedDoc)

    res.json({
      success: true,
      data: { building },
      message: 'Prédio atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar prédio:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const deleteBuilding = async (req, res) => {
  try {
    // Verificar se usuário é admin
    const userIsAdmin = await isAdmin(req.user.uid)
    if (!userIsAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      })
    }

    const { id } = req.params

    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID do prédio inválido'
      })
    }

    const buildingDoc = await admin
      .firestore()
      .collection('buildings')
      .doc(id)
      .get()

    if (!buildingDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Prédio não encontrado'
      })
    }

    // Verificar se há reservas ativas
    const activeReservationsSnapshot = await admin
      .firestore()
      .collection('reservations')
      .where('status', 'in', ['confirmed', 'checked_in'])
      .where('end_time', '>', admin.firestore.Timestamp.now())
      .get()

    // Verificar se alguma reserva ativa pertence a este prédio
    let hasActiveReservations = false
    for (const reservationDoc of activeReservationsSnapshot.docs) {
      const reservation = reservationDoc.data()
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
        if (floorDoc.exists && floorDoc.data().building_id === id) {
          hasActiveReservations = true
          break
        }
      }
    }

    if (hasActiveReservations) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível excluir prédio com reservas ativas'
      })
    }

    await admin.firestore().collection('buildings').doc(id).delete()

    res.json({
      success: true,
      message: 'Prédio excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir prédio:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const getBuildingStats = async (req, res) => {
  try {
    const { id } = req.params

    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID do prédio inválido'
      })
    }

    const buildingDoc = await admin
      .firestore()
      .collection('buildings')
      .doc(id)
      .get()

    if (!buildingDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Prédio não encontrado'
      })
    }

    const building = firestoreDocToObject(buildingDoc)

    // Verificar se usuário não-admin pode ver este prédio
    if (req.user.role !== 'admin' && !building.is_active) {
      return res.status(404).json({
        success: false,
        error: 'Prédio não encontrado'
      })
    }

    // Buscar estatísticas
    const floorsSnapshot = await admin
      .firestore()
      .collection('floors')
      .where('building_id', '==', id)
      .where('is_active', '==', true)
      .get()

    const totalFloors = floorsSnapshot.size

    // Buscar espaços
    let totalSpaces = 0
    let bookableSpaces = 0

    for (const floorDoc of floorsSnapshot.docs) {
      const spacesSnapshot = await admin
        .firestore()
        .collection('spaces')
        .where('floor_id', '==', floorDoc.id)
        .where('is_active', '==', true)
        .get()

      totalSpaces += spacesSnapshot.size

      const bookableSnapshot = await admin
        .firestore()
        .collection('spaces')
        .where('floor_id', '==', floorDoc.id)
        .where('is_active', '==', true)
        .where('is_bookable', '==', true)
        .get()

      bookableSpaces += bookableSnapshot.size
    }

    // Buscar reservas ativas hoje
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const activeReservationsSnapshot = await admin
      .firestore()
      .collection('reservations')
      .where('status', 'in', ['confirmed', 'checked_in'])
      .where('start_time', '>=', admin.firestore.Timestamp.fromDate(today))
      .where('start_time', '<', admin.firestore.Timestamp.fromDate(tomorrow))
      .get()

    let activeReservationsToday = 0
    for (const reservationDoc of activeReservationsSnapshot.docs) {
      const reservation = reservationDoc.data()
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
        if (floorDoc.exists && floorDoc.data().building_id === id) {
          activeReservationsToday++
        }
      }
    }

    const occupancyRate =
      bookableSpaces > 0
        ? ((activeReservationsToday / bookableSpaces) * 100).toFixed(2)
        : 0

    res.json({
      success: true,
      data: {
        building_id: id,
        stats: {
          total_floors: totalFloors,
          total_spaces: totalSpaces,
          bookable_spaces: bookableSpaces,
          active_reservations_today: activeReservationsToday,
          occupancy_rate: occupancyRate
        }
      }
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas do prédio:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

module.exports = {
  getAllBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  getBuildingStats
}
