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

const getAllFloors = async (req, res) => {
  try {
    const { page = 1, limit = 10, building_id, is_active } = req.query
    const offset = (page - 1) * limit

    let query = admin.firestore().collection('floors')

    if (building_id) {
      query = query.where('building_id', '==', building_id)
    }

    if (is_active !== undefined) {
      query = query.where('is_active', '==', is_active === 'true')
    } else if (req.user.role !== 'admin') {
      query = query.where('is_active', '==', true)
    }

    query = query.orderBy('floor_number', 'asc')

    const snapshot = await query
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get()
    const totalSnapshot = await admin.firestore().collection('floors').get()

    const floors = firestoreDocsToArray(snapshot.docs)

    res.json({
      success: true,
      data: {
        floors,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalSnapshot.size / limit),
          total_items: totalSnapshot.size,
          items_per_page: parseInt(limit)
        }
      }
    })
  } catch (error) {
    console.error('Erro ao buscar andares:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const getFloorById = async (req, res) => {
  try {
    const { id } = req.params

    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID do andar inválido'
      })
    }

    const floorDoc = await admin.firestore().collection('floors').doc(id).get()

    if (!floorDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Andar não encontrado'
      })
    }

    const floor = firestoreDocToObject(floorDoc)

    if (req.user.role !== 'admin' && !floor.is_active) {
      return res.status(404).json({
        success: false,
        error: 'Andar não encontrado'
      })
    }

    // Buscar espaços do andar
    const spacesSnapshot = await admin
      .firestore()
      .collection('spaces')
      .where('floor_id', '==', id)
      .get()

    const spaces = firestoreDocsToArray(spacesSnapshot.docs)

    res.json({
      success: true,
      data: { floor: { ...floor, spaces } }
    })
  } catch (error) {
    console.error('Erro ao buscar andar:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const createFloor = async (req, res) => {
  try {
    const userIsAdmin = await isAdmin(req.user.uid)
    if (!userIsAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      })
    }

    const { building_id, name, floor_number, description } = req.body

    if (!building_id || !name || floor_number === undefined) {
      return res.status(400).json({
        success: false,
        error: 'ID do prédio, nome e número do andar são obrigatórios'
      })
    }

    const floorData = createDocumentWithTimestamp({
      building_id,
      name: sanitizeString(name, 100),
      floor_number: parseInt(floor_number),
      description: sanitizeString(description, 500),
      is_active: true
    })

    const docRef = await admin.firestore().collection('floors').add(floorData)
    const floor = { id: docRef.id, ...floorData }

    res.status(201).json({
      success: true,
      data: { floor },
      message: 'Andar criado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao criar andar:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const updateFloor = async (req, res) => {
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
        error: 'ID do andar inválido'
      })
    }

    const floorDoc = await admin.firestore().collection('floors').doc(id).get()

    if (!floorDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Andar não encontrado'
      })
    }

    const { name, floor_number, description, is_active } = req.body

    const updates = updateDocumentWithTimestamp({})

    if (name) updates.name = sanitizeString(name, 100)
    if (floor_number !== undefined)
      updates.floor_number = parseInt(floor_number)
    if (description !== undefined)
      updates.description = sanitizeString(description, 500)
    if (is_active !== undefined) updates.is_active = Boolean(is_active)

    await admin.firestore().collection('floors').doc(id).update(updates)

    const updatedDoc = await admin
      .firestore()
      .collection('floors')
      .doc(id)
      .get()
    const floor = firestoreDocToObject(updatedDoc)

    res.json({
      success: true,
      data: { floor },
      message: 'Andar atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar andar:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const deleteFloor = async (req, res) => {
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
        error: 'ID do andar inválido'
      })
    }

    const floorDoc = await admin.firestore().collection('floors').doc(id).get()

    if (!floorDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Andar não encontrado'
      })
    }

    // Verificar se há espaços ativos
    const spacesSnapshot = await admin
      .firestore()
      .collection('spaces')
      .where('floor_id', '==', id)
      .where('is_active', '==', true)
      .get()

    if (spacesSnapshot.size > 0) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível excluir andar com espaços ativos'
      })
    }

    await admin.firestore().collection('floors').doc(id).delete()

    res.json({
      success: true,
      message: 'Andar excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir andar:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

module.exports = {
  getAllFloors,
  getFloorById,
  createFloor,
  updateFloor,
  deleteFloor
}
