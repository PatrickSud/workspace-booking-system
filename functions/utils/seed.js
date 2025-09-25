const admin = require('firebase-admin')
const { createDocumentWithTimestamp } = require('./utils/validation')

const seedDatabase = async () => {
  try {
    console.log('🌱 Iniciando seed do banco de dados...')

    // Verificar se já existem dados
    const buildingsSnapshot = await admin
      .firestore()
      .collection('buildings')
      .get()
    if (buildingsSnapshot.size > 0) {
      console.log('⚠️ Banco já possui dados. Pulando seed.')
      return
    }

    // Criar usuário admin
    console.log('👤 Criando usuário admin...')
    const adminUser = await admin.auth().createUser({
      email: 'admin@workspace.com',
      password: 'admin123',
      displayName: 'Administrador',
      emailVerified: true
    })

    const adminData = createDocumentWithTimestamp({
      name: 'Administrador',
      email: 'admin@workspace.com',
      role: 'admin',
      is_active: true,
      firebase_uid: adminUser.uid
    })

    await admin
      .firestore()
      .collection('users')
      .doc(adminUser.uid)
      .set(adminData)

    // Criar usuário comum
    console.log('👤 Criando usuário comum...')
    const regularUser = await admin.auth().createUser({
      email: 'user@workspace.com',
      password: 'user123',
      displayName: 'Usuário Teste',
      emailVerified: true
    })

    const userData = createDocumentWithTimestamp({
      name: 'Usuário Teste',
      email: 'user@workspace.com',
      role: 'user',
      is_active: true,
      firebase_uid: regularUser.uid
    })

    await admin
      .firestore()
      .collection('users')
      .doc(regularUser.uid)
      .set(userData)

    // Criar prédios
    console.log('🏢 Criando prédios...')
    const buildings = [
      {
        name: 'Edifício Central',
        address: 'Rua das Flores, 123',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234-567',
        country: 'Brasil',
        description: 'Prédio principal da empresa com modernas instalações',
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
        }
      },
      {
        name: 'Torre Norte',
        address: 'Av. Paulista, 1000',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01310-100',
        country: 'Brasil',
        description: 'Torre moderna com vista panorâmica da cidade',
        settings: {
          business_hours: {
            monday: { start: '07:00', end: '19:00', enabled: true },
            tuesday: { start: '07:00', end: '19:00', enabled: true },
            wednesday: { start: '07:00', end: '19:00', enabled: true },
            thursday: { start: '07:00', end: '19:00', enabled: true },
            friday: { start: '07:00', end: '19:00', enabled: true },
            saturday: { start: '09:00', end: '13:00', enabled: true },
            sunday: { start: '09:00', end: '13:00', enabled: false }
          },
          booking_rules: {
            max_advance_days: 60,
            min_duration_minutes: 60,
            max_duration_minutes: 600,
            max_concurrent_bookings: 5,
            check_in_window_minutes: 30
          },
          amenities: [
            'Wi-Fi',
            'Ar condicionado',
            'Projetor',
            'Café',
            'Estacionamento'
          ]
        },
        contact_info: {
          phone: '(11) 9876-5432',
          email: 'norte@workspace.com',
          manager: 'Maria Santos'
        }
      }
    ]

    const buildingRefs = []
    for (const buildingData of buildings) {
      const buildingDoc = createDocumentWithTimestamp(buildingData)
      const docRef = await admin
        .firestore()
        .collection('buildings')
        .add(buildingDoc)
      buildingRefs.push({ id: docRef.id, ...buildingDoc })
    }

    // Criar andares
    console.log('🏗️ Criando andares...')
    const floors = [
      // Edifício Central
      {
        building_id: buildingRefs[0].id,
        name: 'Térreo',
        floor_number: 0,
        description: 'Recepção e áreas comuns'
      },
      {
        building_id: buildingRefs[0].id,
        name: '1º Andar',
        floor_number: 1,
        description: 'Escritórios administrativos'
      },
      {
        building_id: buildingRefs[0].id,
        name: '2º Andar',
        floor_number: 2,
        description: 'Salas de reunião e espaços colaborativos'
      },
      {
        building_id: buildingRefs[0].id,
        name: '3º Andar',
        floor_number: 3,
        description: 'Escritórios executivos'
      },

      // Torre Norte
      {
        building_id: buildingRefs[1].id,
        name: 'Térreo',
        floor_number: 0,
        description: 'Lobby e recepção'
      },
      {
        building_id: buildingRefs[1].id,
        name: '1º Andar',
        floor_number: 1,
        description: 'Cafeteria e área de convivência'
      },
      {
        building_id: buildingRefs[1].id,
        name: '2º Andar',
        floor_number: 2,
        description: 'Escritórios abertos'
      },
      {
        building_id: buildingRefs[1].id,
        name: '3º Andar',
        floor_number: 3,
        description: 'Salas de reunião'
      },
      {
        building_id: buildingRefs[1].id,
        name: '4º Andar',
        floor_number: 4,
        description: 'Espaços de trabalho flexível'
      }
    ]

    const floorRefs = []
    for (const floorData of floors) {
      const floorDoc = createDocumentWithTimestamp(floorData)
      const docRef = await admin.firestore().collection('floors').add(floorDoc)
      floorRefs.push({ id: docRef.id, ...floorDoc })
    }

    // Criar espaços
    console.log('🪑 Criando espaços...')
    const spaces = [
      // Edifício Central - Térreo
      {
        floor_id: floorRefs[0].id,
        name: 'Recepção',
        type: 'reception',
        capacity: 2,
        description: 'Área de recepção principal',
        amenities: ['Wi-Fi', 'Ar condicionado']
      },

      // Edifício Central - 1º Andar
      {
        floor_id: floorRefs[1].id,
        name: 'Escritório 101',
        type: 'office',
        capacity: 4,
        description: 'Escritório compartilhado',
        amenities: ['Wi-Fi', 'Ar condicionado', 'Mesa individual']
      },
      {
        floor_id: floorRefs[1].id,
        name: 'Escritório 102',
        type: 'office',
        capacity: 6,
        description: 'Escritório em equipe',
        amenities: ['Wi-Fi', 'Ar condicionado', 'Mesa compartilhada']
      },

      // Edifício Central - 2º Andar
      {
        floor_id: floorRefs[2].id,
        name: 'Sala de Reunião A',
        type: 'meeting_room',
        capacity: 8,
        description: 'Sala para reuniões pequenas',
        amenities: ['Wi-Fi', 'Ar condicionado', 'Projetor', 'Quadro branco']
      },
      {
        floor_id: floorRefs[2].id,
        name: 'Sala de Reunião B',
        type: 'meeting_room',
        capacity: 12,
        description: 'Sala para reuniões médias',
        amenities: [
          'Wi-Fi',
          'Ar condicionado',
          'Projetor',
          'Quadro branco',
          'Sistema de áudio'
        ]
      },
      {
        floor_id: floorRefs[2].id,
        name: 'Espaço Colaborativo',
        type: 'collaborative',
        capacity: 20,
        description: 'Área para trabalho em equipe',
        amenities: [
          'Wi-Fi',
          'Ar condicionado',
          'Mesas móveis',
          'Quadros brancos'
        ]
      },

      // Edifício Central - 3º Andar
      {
        floor_id: floorRefs[3].id,
        name: 'Escritório Executivo 301',
        type: 'office',
        capacity: 2,
        description: 'Escritório privativo',
        amenities: ['Wi-Fi', 'Ar condicionado', 'Mesa executiva', 'Poltrona']
      },
      {
        floor_id: floorRefs[3].id,
        name: 'Escritório Executivo 302',
        type: 'office',
        capacity: 2,
        description: 'Escritório privativo',
        amenities: ['Wi-Fi', 'Ar condicionado', 'Mesa executiva', 'Poltrona']
      },

      // Torre Norte - Térreo
      {
        floor_id: floorRefs[4].id,
        name: 'Lobby Principal',
        type: 'reception',
        capacity: 5,
        description: 'Área de recepção e espera',
        amenities: ['Wi-Fi', 'Ar condicionado', 'Poltronas']
      },

      // Torre Norte - 1º Andar
      {
        floor_id: floorRefs[5].id,
        name: 'Cafeteria',
        type: 'cafeteria',
        capacity: 30,
        description: 'Área de alimentação e convivência',
        amenities: ['Wi-Fi', 'Ar condicionado', 'Máquina de café', 'Microondas']
      },

      // Torre Norte - 2º Andar
      {
        floor_id: floorRefs[6].id,
        name: 'Escritório Aberto A',
        type: 'open_office',
        capacity: 15,
        description: 'Espaço de trabalho aberto',
        amenities: ['Wi-Fi', 'Ar condicionado', 'Mesas compartilhadas']
      },
      {
        floor_id: floorRefs[6].id,
        name: 'Escritório Aberto B',
        type: 'open_office',
        capacity: 15,
        description: 'Espaço de trabalho aberto',
        amenities: ['Wi-Fi', 'Ar condicionado', 'Mesas compartilhadas']
      },

      // Torre Norte - 3º Andar
      {
        floor_id: floorRefs[7].id,
        name: 'Sala de Conferência',
        type: 'conference',
        capacity: 20,
        description: 'Sala para grandes reuniões',
        amenities: [
          'Wi-Fi',
          'Ar condicionado',
          'Projetor',
          'Sistema de áudio',
          'Videoconferência'
        ]
      },
      {
        floor_id: floorRefs[7].id,
        name: 'Sala de Treinamento',
        type: 'training',
        capacity: 25,
        description: 'Sala para treinamentos e workshops',
        amenities: [
          'Wi-Fi',
          'Ar condicionado',
          'Projetor',
          'Quadro branco',
          'Mesas em U'
        ]
      },

      // Torre Norte - 4º Andar
      {
        floor_id: floorRefs[8].id,
        name: 'Espaço Flexível A',
        type: 'flexible',
        capacity: 10,
        description: 'Espaço adaptável para diferentes usos',
        amenities: ['Wi-Fi', 'Ar condicionado', 'Mesas móveis', 'Divisórias']
      },
      {
        floor_id: floorRefs[8].id,
        name: 'Espaço Flexível B',
        type: 'flexible',
        capacity: 10,
        description: 'Espaço adaptável para diferentes usos',
        amenities: ['Wi-Fi', 'Ar condicionado', 'Mesas móveis', 'Divisórias']
      },
      {
        floor_id: floorRefs[8].id,
        name: 'Sala de Estudos',
        type: 'study',
        capacity: 6,
        description: 'Ambiente silencioso para estudos',
        amenities: [
          'Wi-Fi',
          'Ar condicionado',
          'Mesa individual',
          'Iluminação adequada'
        ]
      }
    ]

    const spaceRefs = []
    for (const spaceData of spaces) {
      const spaceDoc = createDocumentWithTimestamp({
        ...spaceData,
        is_active: true,
        is_bookable: true
      })
      const docRef = await admin.firestore().collection('spaces').add(spaceDoc)
      spaceRefs.push({ id: docRef.id, ...spaceDoc })
    }

    // Criar algumas reservas de exemplo
    console.log('📅 Criando reservas de exemplo...')
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)

    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setHours(11, 0, 0, 0)

    const reservations = [
      {
        user_id: regularUser.uid,
        space_id: spaceRefs[3].id, // Sala de Reunião A
        start_time: admin.firestore.Timestamp.fromDate(tomorrow),
        end_time: admin.firestore.Timestamp.fromDate(dayAfterTomorrow),
        title: 'Reunião de Planejamento',
        description: 'Reunião semanal da equipe',
        attendees_count: 6,
        status: 'confirmed'
      },
      {
        user_id: adminUser.uid,
        space_id: spaceRefs[4].id, // Sala de Reunião B
        start_time: admin.firestore.Timestamp.fromDate(
          new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000)
        ), // 2 horas depois
        end_time: admin.firestore.Timestamp.fromDate(
          new Date(tomorrow.getTime() + 4 * 60 * 60 * 1000)
        ), // 4 horas depois
        title: 'Apresentação Executiva',
        description: 'Apresentação de resultados para diretoria',
        attendees_count: 10,
        status: 'confirmed'
      }
    ]

    for (const reservationData of reservations) {
      const reservationDoc = createDocumentWithTimestamp(reservationData)
      await admin.firestore().collection('reservations').add(reservationDoc)
    }

    console.log('✅ Seed do banco de dados concluído com sucesso!')
    console.log(`📊 Dados criados:`)
    console.log(`   - ${buildings.length} prédios`)
    console.log(`   - ${floors.length} andares`)
    console.log(`   - ${spaces.length} espaços`)
    console.log(`   - ${reservations.length} reservas`)
    console.log(`   - 2 usuários (admin e comum)`)
    console.log('')
    console.log('🔑 Credenciais de acesso:')
    console.log('   Admin: admin@workspace.com / admin123')
    console.log('   Usuário: user@workspace.com / user123')
  } catch (error) {
    console.error('❌ Erro durante o seed:', error)
    throw error
  }
}

module.exports = {
  seedDatabase
}
