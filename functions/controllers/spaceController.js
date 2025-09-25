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

const getAllSpaces = async (req, res) => {
  try {
    const { page = 1, limit = 10, floor_id, is_active, is_bookable } = req.query
    const offset = (page - 1) * limit

    let query = admin.firestore().collection('spaces')

    if (floor_id) {
      query = query.where('floor_id', '==', floor_id)
    }

    if (is_active !== undefined) {
      query = query.where('is_active', '==', is_active === 'true')
    } else if (req.user.role !== 'admin') {
      query = query.where('is_active', '==', true)
    }

    if (is_bookable !== undefined) {
      query = query.where('is_bookable', '==', is_bookable === 'true')
    }

    query = query.orderBy('name', 'asc')

    const snapshot = await query
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get()
    const totalSnapshot = await admin.firestore().collection('spaces').get()

    const spaces = firestoreDocsToArray(snapshot.docs)

    res.json({
      success: true,
      data: {
        spaces,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalSnapshot.size / limit),
          total_items: totalSnapshot.size,
          items_per_page: parseInt(limit)
        }
      }
    })
  } catch (error) {
    console.error('Erro ao buscar espaços:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const getSpaceById = async (req, res) => {
  try {
    const { id } = req.params

    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID do espaço inválido'
      })
    }

    const spaceDoc = await admin.firestore().collection('spaces').doc(id).get()

    if (!spaceDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Espaço não encontrado'
      })
    }

    const space = firestoreDocToObject(spaceDoc)

    if (req.user.role !== 'admin' && !space.is_active) {
      return res.status(404).json({
        success: false,
        error: 'Espaço não encontrado'
      })
    }

    res.json({
      success: true,
      data: { space }
    })
  } catch (error) {
    console.error('Erro ao buscar espaço:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const createSpace = async (req, res) => {
  try {
    const userIsAdmin = await isAdmin(req.user.uid)
    if (!userIsAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      })
    }

    const { floor_id, name, type, capacity, description, amenities } = req.body

    if (!floor_id || !name || !type || !capacity) {
      return res.status(400).json({
        success: false,
        error: 'ID do andar, nome, tipo e capacidade são obrigatórios'
      })
    }

    const spaceData = createDocumentWithTimestamp({
      floor_id,
      name: sanitizeString(name, 100),
      type: sanitizeString(type, 50),
      capacity: parseInt(capacity),
      description: sanitizeString(description, 500),
      amenities: amenities || [],
      is_active: true,
      is_bookable: true
    })

    const docRef = await admin.firestore().collection('spaces').add(spaceData)
    const space = { id: docRef.id, ...spaceData }

    res.status(201).json({
      success: true,
      data: { space },
      message: 'Espaço criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar espaço:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const updateSpace = async (req, res) => {
  try {
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
        error: 'ID do espaço inválido'
      })
    }

    const spaceDoc = await admin.firestore().collection('spaces').doc(id).get()

    if (!spaceDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Espaço não encontrado'
      })
    }

    const {
      name,
      type,
      capacity,
      description,
      amenities,
      is_active,
      is_bookable
    } = req.body

    const updates = updateDocumentWithTimestamp({})

    if (name) updates.name = sanitizeString(name, 100)
    if (type) updates.type = sanitizeString(type, 50)
    if (capacity) updates.capacity = parseInt(capacity)
    if (description !== undefined)
      updates.description = sanitizeString(description, 500)
    if (amenities) updates.amenities = amenities
    if (is_active !== undefined) updates.is_active = Boolean(is_active)
    if (is_bookable !== undefined) updates.is_bookable = Boolean(is_bookable)

    await admin.firestore().collection('spaces').doc(id).update(updates)

    const updatedDoc = await admin
      .firestore()
      .collection('spaces')
      .doc(id)
      .get()
    const space = firestoreDocToObject(updatedDoc)

    res.json({
      success: true,
      data: { space },
      message: 'Espaço atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar espaço:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const deleteSpace = async (req, res) => {
  try {
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
        error: 'ID do espaço inválido'
      })
    }

    const spaceDoc = await admin.firestore().collection('spaces').doc(id).get()

    if (!spaceDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Espaço não encontrado'
      })
    }

    // Verificar se há reservas ativas
    const activeReservationsSnapshot = await admin
      .firestore()
      .collection('reservations')
      .where('space_id', '==', id)
      .where('status', 'in', ['confirmed', 'checked_in'])
      .where('end_time', '>', admin.firestore.Timestamp.now())
      .get()

    if (activeReservationsSnapshot.size > 0) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível excluir espaço com reservas ativas'
      })
    }

    await admin.firestore().collection('spaces').doc(id).delete()

    res.json({
      success: true,
      message: 'Espaço excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir espaço:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

module.exports = {
  getAllSpaces,
  getSpaceById,
  createSpace,
  updateSpace,
  deleteSpace
}
