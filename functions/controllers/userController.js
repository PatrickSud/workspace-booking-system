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

const getAllUsers = async (req, res) => {
  try {
    const userIsAdmin = await isAdmin(req.user.uid)
    if (!userIsAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      })
    }

    const { page = 1, limit = 10, role, is_active } = req.query
    const offset = (page - 1) * limit

    let query = admin.firestore().collection('users')

    if (role) {
      query = query.where('role', '==', role)
    }

    if (is_active !== undefined) {
      query = query.where('is_active', '==', is_active === 'true')
    }

    query = query.orderBy('name', 'asc')

    const snapshot = await query
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get()
    const totalSnapshot = await admin.firestore().collection('users').get()

    const users = firestoreDocsToArray(snapshot.docs)

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(totalSnapshot.size / limit),
          total_items: totalSnapshot.size,
          items_per_page: parseInt(limit)
        }
      }
    })
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const getUserById = async (req, res) => {
  try {
    const { id } = req.params

    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID do usuário inválido'
      })
    }

    // Usuários só podem ver seus próprios dados, exceto admins
    if (req.user.role !== 'admin' && req.user.uid !== id) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      })
    }

    const userDoc = await admin.firestore().collection('users').doc(id).get()

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      })
    }

    const user = firestoreDocToObject(userDoc)

    res.json({
      success: true,
      data: { user }
    })
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const updateUser = async (req, res) => {
  try {
    const { id } = req.params

    if (!validateUUID(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID do usuário inválido'
      })
    }

    // Usuários só podem editar seus próprios dados, exceto admins
    if (req.user.role !== 'admin' && req.user.uid !== id) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado'
      })
    }

    const userDoc = await admin.firestore().collection('users').doc(id).get()

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      })
    }

    const { name, role, is_active } = req.body

    const updates = updateDocumentWithTimestamp({})

    if (name) updates.name = sanitizeString(name, 100)

    // Apenas admins podem alterar role e status ativo
    if (req.user.role === 'admin') {
      if (role) updates.role = role
      if (is_active !== undefined) updates.is_active = Boolean(is_active)
    }

    await admin.firestore().collection('users').doc(id).update(updates)

    const updatedDoc = await admin.firestore().collection('users').doc(id).get()
    const user = firestoreDocToObject(updatedDoc)

    res.json({
      success: true,
      data: { user },
      message: 'Usuário atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const deleteUser = async (req, res) => {
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
        error: 'ID do usuário inválido'
      })
    }

    const userDoc = await admin.firestore().collection('users').doc(id).get()

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      })
    }

    // Verificar se há reservas ativas
    const activeReservationsSnapshot = await admin
      .firestore()
      .collection('reservations')
      .where('user_id', '==', id)
      .where('status', 'in', ['confirmed', 'checked_in'])
      .where('end_time', '>', admin.firestore.Timestamp.now())
      .get()

    if (activeReservationsSnapshot.size > 0) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível excluir usuário com reservas ativas'
      })
    }

    // Deletar usuário do Firebase Auth
    await admin.auth().deleteUser(id)

    // Deletar documento do Firestore
    await admin.firestore().collection('users').doc(id).delete()

    res.json({
      success: true,
      message: 'Usuário excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
}
