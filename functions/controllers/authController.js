const admin = require('firebase-admin')
const {
  validateEmail,
  validatePassword,
  getUserByEmail,
  createDocumentWithTimestamp
} = require('../utils/validation')

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios'
      })
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email inválido'
      })
    }

    // Buscar usuário no Firestore
    const user = await getUserByEmail(email)

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      })
    }

    // Verificar se usuário está ativo
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Conta desativada'
      })
    }

    // Criar token personalizado do Firebase
    const customToken = await admin.auth().createCustomToken(user.id, {
      role: user.role,
      email: user.email,
      name: user.name
    })

    // Buscar token ID do Firebase Auth
    const idToken = await admin.auth().createCustomToken(user.id)

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_active: user.is_active
        },
        token: customToken,
        idToken: idToken
      },
      message: 'Login realizado com sucesso'
    })
  } catch (error) {
    console.error('Erro no login:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const register = async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Nome, email e senha são obrigatórios'
      })
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email inválido'
      })
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.message
      })
    }

    // Verificar se email já existe
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email já está em uso'
      })
    }

    // Criar usuário no Firebase Auth
    const firebaseUser = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
      emailVerified: false
    })

    // Criar documento do usuário no Firestore
    const userData = createDocumentWithTimestamp({
      name: name.trim(),
      email: email.toLowerCase(),
      role: role,
      is_active: true,
      firebase_uid: firebaseUser.uid
    })

    await admin
      .firestore()
      .collection('users')
      .doc(firebaseUser.uid)
      .set(userData)

    // Criar token personalizado
    const customToken = await admin.auth().createCustomToken(firebaseUser.uid, {
      role: role,
      email: email,
      name: name
    })

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: firebaseUser.uid,
          name: name,
          email: email,
          role: role,
          is_active: true
        },
        token: customToken
      },
      message: 'Usuário criado com sucesso'
    })
  } catch (error) {
    console.error('Erro no registro:', error)

    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({
        success: false,
        error: 'Email já está em uso'
      })
    }

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token é obrigatório'
      })
    }

    // Firebase Auth gerencia refresh tokens automaticamente
    // Esta função é para compatibilidade com a API existente
    res.json({
      success: true,
      message: 'Token renovado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao renovar token:', error)
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    })
  }
}

module.exports = {
  login,
  register,
  refreshToken
}
