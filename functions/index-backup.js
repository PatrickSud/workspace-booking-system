const functions = require('firebase-functions')
const admin = require('firebase-admin')
const cors = require('cors')({ origin: true })

// Initialize Firebase Admin
admin.initializeApp()
const db = admin.firestore()

// Import controllers
const authController = require('./controllers/authController')
const buildingController = require('./controllers/buildingController')
const floorController = require('./controllers/floorController')
const spaceController = require('./controllers/spaceController')
const reservationController = require('./controllers/reservationController')
const userController = require('./controllers/userController')
const reportController = require('./controllers/reportController')

// Middleware para autenticação
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de acesso necessário'
      })
    }

    const decodedToken = await admin.auth().verifyIdToken(token)

    // Buscar dados do usuário no Firestore
    const userDoc = await db.collection('users').doc(decodedToken.uid).get()
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      })
    }

    const userData = userDoc.data()
    if (!userData.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Conta desativada'
      })
    }

    req.user = {
      uid: decodedToken.uid,
      ...userData
    }
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(403).json({
      success: false,
      error: 'Token inválido'
    })
  }
}

// Health check
exports.health = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Firebase Functions'
    })
  })
})

// Auth routes
exports.login = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authController.login(req, res)
  })
})

exports.register = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authController.register(req, res)
  })
})

exports.refreshToken = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authController.refreshToken(req, res)
  })
})

// Building routes
exports.getAllBuildings = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      buildingController.getAllBuildings(req, res)
    })
  })
})

exports.getBuildingById = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      buildingController.getBuildingById(req, res)
    })
  })
})

exports.createBuilding = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      buildingController.createBuilding(req, res)
    })
  })
})

exports.updateBuilding = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      buildingController.updateBuilding(req, res)
    })
  })
})

exports.deleteBuilding = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      buildingController.deleteBuilding(req, res)
    })
  })
})

exports.getBuildingStats = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      buildingController.getBuildingStats(req, res)
    })
  })
})

// Floor routes
exports.getAllFloors = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      floorController.getAllFloors(req, res)
    })
  })
})

exports.getFloorById = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      floorController.getFloorById(req, res)
    })
  })
})

exports.createFloor = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      floorController.createFloor(req, res)
    })
  })
})

exports.updateFloor = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      floorController.updateFloor(req, res)
    })
  })
})

exports.deleteFloor = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      floorController.deleteFloor(req, res)
    })
  })
})

// Space routes
exports.getAllSpaces = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      spaceController.getAllSpaces(req, res)
    })
  })
})

exports.getSpaceById = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      spaceController.getSpaceById(req, res)
    })
  })
})

exports.createSpace = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      spaceController.createSpace(req, res)
    })
  })
})

exports.updateSpace = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      spaceController.updateSpace(req, res)
    })
  })
})

exports.deleteSpace = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      spaceController.deleteSpace(req, res)
    })
  })
})

// Reservation routes
exports.getAllReservations = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      reservationController.getAllReservations(req, res)
    })
  })
})

exports.getReservationById = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      reservationController.getReservationById(req, res)
    })
  })
})

exports.createReservation = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      reservationController.createReservation(req, res)
    })
  })
})

exports.updateReservation = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      reservationController.updateReservation(req, res)
    })
  })
})

exports.cancelReservation = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      reservationController.cancelReservation(req, res)
    })
  })
})

exports.checkIn = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      reservationController.checkIn(req, res)
    })
  })
})

exports.checkOut = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      reservationController.checkOut(req, res)
    })
  })
})

// User routes
exports.getAllUsers = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      userController.getAllUsers(req, res)
    })
  })
})

exports.getUserById = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      userController.getUserById(req, res)
    })
  })
})

exports.updateUser = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      userController.updateUser(req, res)
    })
  })
})

exports.deleteUser = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      userController.deleteUser(req, res)
    })
  })
})

// Report routes
exports.getReports = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      reportController.getReports(req, res)
    })
  })
})

exports.getOccupancyReport = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      reportController.getOccupancyReport(req, res)
    })
  })
})

exports.getUserReport = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    authenticateToken(req, res, () => {
      reportController.getUserReport(req, res)
    })
  })
})

// Seed function para popular o banco
exports.seedDatabase = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const seedScript = require('./utils/seed')
      await seedScript.seedDatabase()
      res.status(200).json({
        success: true,
        message: 'Banco de dados populado com sucesso'
      })
    } catch (error) {
      console.error('Erro ao popular banco:', error)
      res.status(500).json({
        success: false,
        error: 'Erro ao popular banco de dados'
      })
    }
  })
})
