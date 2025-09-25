const admin = require('firebase-admin')

// Função para validar UUID (Firestore usa strings como IDs)
const validateUUID = id => {
  if (!id || typeof id !== 'string') return false
  // Firestore document IDs devem ter entre 1-1500 caracteres e não podem conter certos caracteres
  return id.length >= 1 && id.length <= 1500 && !/[\/\s]/.test(id)
}

// Função para sanitizar strings
const sanitizeString = (str, maxLength = 1000) => {
  if (!str) return ''
  return String(str).trim().substring(0, maxLength)
}

// Função para converter timestamp do Firestore para Date
const firestoreTimestampToDate = timestamp => {
  if (!timestamp) return null
  if (timestamp.toDate) return timestamp.toDate()
  if (timestamp instanceof Date) return timestamp
  return new Date(timestamp)
}

// Função para converter Date para timestamp do Firestore
const dateToFirestoreTimestamp = date => {
  if (!date) return null
  if (date instanceof Date) return admin.firestore.Timestamp.fromDate(date)
  return admin.firestore.Timestamp.fromDate(new Date(date))
}

// Função para criar documento com timestamp
const createDocumentWithTimestamp = data => {
  const now = admin.firestore.Timestamp.now()
  return {
    ...data,
    created_at: now,
    updated_at: now
  }
}

// Função para atualizar documento com timestamp
const updateDocumentWithTimestamp = data => {
  return {
    ...data,
    updated_at: admin.firestore.Timestamp.now()
  }
}

// Função para paginação no Firestore
const paginateQuery = (query, page = 1, limit = 10) => {
  const offset = (page - 1) * limit
  return query.limit(limit).offset(offset)
}

// Função para buscar documentos com filtros
const buildWhereClause = filters => {
  let query = null

  Object.keys(filters).forEach(key => {
    if (
      filters[key] !== undefined &&
      filters[key] !== null &&
      filters[key] !== ''
    ) {
      if (query === null) {
        query = admin.firestore().collection('temp') // Collection temporária para construir query
      }

      if (key === 'search') {
        // Para busca textual, usamos array-contains ou range queries
        // Esta é uma implementação simplificada
        query = query
          .where(key, '>=', filters[key])
          .where(key, '<=', filters[key] + '\uf8ff')
      } else if (typeof filters[key] === 'boolean') {
        query = query.where(key, '==', filters[key])
      } else if (typeof filters[key] === 'number') {
        query = query.where(key, '==', filters[key])
      } else {
        query = query.where(key, '==', filters[key])
      }
    }
  })

  return query
}

// Função para converter documento do Firestore para objeto JavaScript
const firestoreDocToObject = doc => {
  if (!doc.exists) return null

  const data = doc.data()
  const id = doc.id

  // Converter timestamps para Date
  Object.keys(data).forEach(key => {
    if (data[key] && data[key].toDate) {
      data[key] = data[key].toDate()
    }
  })

  return { id, ...data }
}

// Função para converter array de documentos do Firestore
const firestoreDocsToArray = docs => {
  return docs.map(doc => firestoreDocToObject(doc))
}

// Função para gerar ID único (similar ao UUID)
const generateId = () => {
  return admin.firestore().collection('temp').doc().id
}

// Função para validar email
const validateEmail = email => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Função para validar senha forte
const validatePassword = password => {
  if (!password || password.length < 6) {
    return { valid: false, message: 'Senha deve ter pelo menos 6 caracteres' }
  }
  return { valid: true }
}

// Função para hash de senha (usando Firebase Auth)
const hashPassword = async password => {
  // Firebase Auth gerencia senhas automaticamente
  // Esta função é apenas para compatibilidade
  return password
}

// Função para verificar se usuário é admin
const isAdmin = async userId => {
  try {
    const userDoc = await admin
      .firestore()
      .collection('users')
      .doc(userId)
      .get()
    if (!userDoc.exists) return false

    const userData = userDoc.data()
    return userData.role === 'admin'
  } catch (error) {
    console.error('Erro ao verificar se usuário é admin:', error)
    return false
  }
}

// Função para buscar usuário por email
const getUserByEmail = async email => {
  try {
    const usersSnapshot = await admin
      .firestore()
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get()

    if (usersSnapshot.empty) return null

    return firestoreDocToObject(usersSnapshot.docs[0])
  } catch (error) {
    console.error('Erro ao buscar usuário por email:', error)
    return null
  }
}

module.exports = {
  validateUUID,
  sanitizeString,
  firestoreTimestampToDate,
  dateToFirestoreTimestamp,
  createDocumentWithTimestamp,
  updateDocumentWithTimestamp,
  paginateQuery,
  buildWhereClause,
  firestoreDocToObject,
  firestoreDocsToArray,
  generateId,
  validateEmail,
  validatePassword,
  hashPassword,
  isAdmin,
  getUserByEmail
}
