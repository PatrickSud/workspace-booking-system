const admin = require('firebase-admin')

// Configuração do Firebase (substitua pelas suas credenciais)
const serviceAccount = {
  type: 'service_account',
  project_id: 'workspace-booking-system',
  private_key_id: 'abed9beccd98a6181c6772c1d9acdda12fdf4be6',
  private_key: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCVqA8CsCtoopFZ\nCfXXHDX3FmRGWHhNEAUPiHADaDtWADOh82wZS7GFQ0nOWi/cwp51sorILQFKu4lu\nOLuMh0XyVHO4cw5zw261G0wKjgczOFcvrMjVe+Vhtbe34nMSG6amE3XarnFzqYQW\npEJmwXxAAT1vfxtA3Ci5rJnsf00sJYbcps7v7hJv3A2UV2MRtGvXn/in3QAHI1gg\n/CNMLJSzSaBziSf4ta+uY8ScvkcmmZVz09NE8LZPRfeWORsogwHrWP7pkCkKjMjd\nnQXarB60gHHM9E10IFEgWa838CnOQHvqIEOHk4wx/SxsybV2mkkHr41FHOkj2LgZ\noTgjwtvNAgMBAAECggEAA48kGRrN08R5I2C1TKaJWwUq/GhMuY8HAqQF/2B15abz\nykKcF1nGGf2Qt5w5+dEwFVmQ/bz0jV/oMX3DRYWPEEMQ1jDTvLK1jEa6YXwF3pld\n9JeyeuYiKxd4J4dbIU05ZzTKWJBgJJGCLQIaIAb75mGjdCZoP8UIDjPQruRdKJfC\n/+Nmbhk9zNnr3ZktpdbfghsmT2/WGWo3OrU/1VR5fRls+pxi9rydmWqcmAxrV2SR\nrpCOGrqHACDiJRp2F70JBbYTABwPP3iCCVbqLBmVYpR0Ie6ZUFNM6ZapACMEusgM\n0LbY+tpoE6og10zTTFn6G/14LG8mfz4kqbdtL5q28QKBgQDGbsUh52N5jBVctsXX\nkCz4pCiqx5QMQx9j/OEo6HtWZHd+6FKX/qrCrxyigmC0TJ0JSd6nhhkkvUSTOPaS\nIy+RRWln5YJXsTKFmY8Vb16GPuaTgKIm2ZO2UOa+2lESjZoH1pX2C0mk/EHUz1h6\n7OR5BSSNYudrF0AF010stZAOcQKBgQDBEsTfx90SpFDq+6d0ixrcAFdLkvtMJi9K\nsf8qj2EGlIABW09FB40FPfyFdAyd6pikc2iXu9oqM+FgkLYL5oaaFiSwlEXEnV/P\nk8sxgCBpcI2sU5SLGfnkH/LQ1vmbtJlzOrFbMlknlvsHahxNMTX/dbu2r3SdztPU\ncZnmAwNJHQKBgFv5sgQSBYisRqaPzUoqeL3TEUp/cX7xidZFu3PDto+Hx9+Z/daX\n4zyUADjPJ9XKgStyAvMxc+wUknmO+LMp/f1e6AmRVwYgiyNj1u9/jJe7BhMul3pc\ndVwXSa0C8nsgCVpCu4WtG7iOeFEUvpVTwl7Z5GRoiI2Z3EIXA2Qa0CfxAoGARMif\nAup9RAruGQkWm1qDcyVb9Dyk8ngYGRBYy5zRADsfb1xMXVdXUirHL/QsGoZdYxkK\nhiQSkT5yaKilco/qHDMPVyk7wdQfMiCBH116LpY+osoT/Yp/kFohc21i96nbkUWz\nsb26LXSIchfHhWimyB/1hBv1+9KXfPQL0/n2zbECgYEAsJunCR3UQrJU/6FTXP/T\nZClWTYhxSDmpS1ey2HVBHpFImMLAWuNDJpUyLNCOZ4J2AitgNfW+FN7lxHh6fBFA\nUbRPefCRji/+JFDN4AXrdgv16tLKJTUVnvysDWi3+3f9wAn8Bej/yJrJz7wJisBV\nWvSExLfpOANTRykWFibNVVs=\n-----END PRIVATE KEY-----\n',
  client_email: 'firebase-adminsdk-fbsvc@workspace-booking-system.iam.gserviceaccount.com',
  client_id: '104842037109994143722',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token'
};

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'workspace-booking-system'
})

const db = admin.firestore()

// Dados para inserir
const seedData = {
  users: [
    {
      id: 'admin-user',
      data: {
        name: 'Administrador',
        email: 'admin@workspace.com',
        role: 'admin',
        is_active: true,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      }
    },
    {
      id: 'regular-user',
      data: {
        name: 'Usuário Teste',
        email: 'user@workspace.com',
        role: 'user',
        is_active: true,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      }
    }
  ],
  buildings: [
    {
      data: {
        name: 'Edifício Central',
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234-567',
        country: 'Brasil',
        description: 'Prédio principal da empresa',
        is_active: true,
        settings: {
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
          amenities: ['Wi-Fi', 'Ar condicionado', 'Projetor', 'Café']
        },
        contact_info: {
          phone: '(11) 1234-5678',
          email: 'central@workspace.com',
          manager: 'João Silva'
        },
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      }
    }
  ]
}

// Função para popular o banco
async function populateDatabase() {
  try {
    console.log('🌱 Iniciando população do banco...')

    // Inserir usuários
    for (const user of seedData.users) {
      await db.collection('users').doc(user.id).set(user.data)
      console.log(`✅ Usuário ${user.data.name} criado`)
    }

    // Inserir prédios
    for (const building of seedData.buildings) {
      const docRef = await db.collection('buildings').add(building.data)
      console.log(`✅ Prédio ${building.data.name} criado com ID: ${docRef.id}`)
    }

    console.log('🎉 Banco populado com sucesso!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro ao popular banco:', error)
    process.exit(1)
  }
}

// Executar
populateDatabase()
