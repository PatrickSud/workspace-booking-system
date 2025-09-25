const admin = require('firebase-admin')

// Inicializar Firebase Admin
admin.initializeApp({
  projectId: 'workspace-booking-system'
})

const { seedDatabase } = require('./utils/seed')

// Executar seed
seedDatabase()
  .then(() => {
    console.log('✅ Seed executado com sucesso!')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Erro ao executar seed:', error)
    process.exit(1)
  })
