const functions = require('firebase-functions')
const admin = require('firebase-admin')
const cors = require('cors')({ origin: true })

// Initialize Firebase Admin
admin.initializeApp()
const db = admin.firestore()

// Health check simples
exports.health = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Firebase Functions',
      message: 'Sistema funcionando corretamente'
    })
  })
})

// Login simples para teste
exports.login = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email e senha são obrigatórios'
        })
      }

      // Credenciais de teste
      if (email === 'admin@workspace.com' && password === 'admin123') {
        return res.status(200).json({
          success: true,
          data: {
            user: {
              id: '1',
              email: 'admin@workspace.com',
              name: 'Administrador',
              role: 'admin',
              department: 'TI',
              phone: '(11) 99999-9999'
            },
            token: 'test-token-' + Date.now()
          }
        })
      }

      if (email === 'ana.silva@empresa.com' && password === 'user123') {
        return res.status(200).json({
          success: true,
          data: {
            user: {
              id: '2',
              email: 'ana.silva@empresa.com',
              name: 'Ana Silva',
              role: 'user',
              department: 'Vendas',
              phone: '(11) 88888-8888'
            },
            token: 'test-token-' + Date.now()
          }
        })
      }

      return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
      })

    } catch (error) {
      console.error('Login error:', error)
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  })
})

// Get profile simples
exports.getProfile = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    try {
      const authHeader = req.headers.authorization
      const token = authHeader && authHeader.split(' ')[1]

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Token de acesso necessário'
        })
      }

      // Retornar perfil de teste
      return res.status(200).json({
        success: true,
        data: {
          id: '1',
          email: 'admin@workspace.com',
          name: 'Administrador',
          role: 'admin',
          department: 'TI',
          phone: '(11) 99999-9999'
        }
      })

    } catch (error) {
      console.error('Get profile error:', error)
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      })
    }
  })
})
