require('dotenv').config();
const { sequelize, models } = require('./connection');

const seedData = async () => {
  try {
    console.log('🌱 Iniciando seed do banco de dados...');

    // Sync database
    await sequelize.sync({ force: true });
    console.log('✅ Banco de dados sincronizado');

    // Create admin user
    const adminUser = await models.User.create({
      name: 'Administrador',
      email: 'admin@workspace.com',
      password: 'admin123',
      role: 'admin',
      department: 'TI'
    });
    console.log('✅ Usuário administrador criado');

    // Create buildings
    const building1 = await models.Building.create({
      name: 'Edifício Principal',
      address: 'Rua das Empresas, 123',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01234-567',
      country: 'Brasil',
      description: 'Sede principal da empresa',
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
        amenities: ['wifi', 'ar_condicionado', 'cafe', 'estacionamento']
      },
      contact_info: {
        phone: '(11) 1234-5678',
        email: 'contato@empresa.com',
        manager: 'João Silva'
      }
    });

    const building2 = await models.Building.create({
      name: 'Anexo Comercial',
      address: 'Av. Paulista, 456',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01310-100',
      country: 'Brasil',
      description: 'Anexo para reuniões e eventos',
      settings: {
        business_hours: {
          monday: { start: '09:00', end: '17:00', enabled: true },
          tuesday: { start: '09:00', end: '17:00', enabled: true },
          wednesday: { start: '09:00', end: '17:00', enabled: true },
          thursday: { start: '09:00', end: '17:00', enabled: true },
          friday: { start: '09:00', end: '17:00', enabled: true },
          saturday: { start: '09:00', end: '13:00', enabled: false },
          sunday: { start: '09:00', end: '13:00', enabled: false }
        },
        booking_rules: {
          max_advance_days: 60,
          min_duration_minutes: 60,
          max_duration_minutes: 240,
          max_concurrent_bookings: 2,
          check_in_window_minutes: 10
        },
        amenities: ['wifi', 'projetor', 'som', 'catering']
      }
    });

    console.log('✅ Prédios criados');

    // Create floors
    const floor1_1 = await models.Floor.create({
      building_id: building1.id,
      name: '1º Andar',
      floor_number: 1,
      description: 'Andar térreo com recepção e espaços colaborativos'
    });

    const floor1_2 = await models.Floor.create({
      building_id: building1.id,
      name: '2º Andar',
      floor_number: 2,
      description: 'Andar com estações de trabalho e salas de reunião'
    });

    const floor1_3 = await models.Floor.create({
      building_id: building1.id,
      name: '3º Andar',
      floor_number: 3,
      description: 'Andar executivo com salas de diretoria'
    });

    const floor2_1 = await models.Floor.create({
      building_id: building2.id,
      name: 'Térreo',
      floor_number: 0,
      description: 'Auditório e salas de evento'
    });

    console.log('✅ Andares criados');

    // Create spaces
    const spaces = [];

    // Floor 1-1 spaces (collaborative spaces)
    for (let i = 1; i <= 10; i++) {
      spaces.push({
        floor_id: floor1_1.id,
        name: `Mesa Colaborativa ${i}`,
        type: 'workstation',
        capacity: 1,
        description: `Estação de trabalho colaborativa ${i}`,
        position: {
          x: (i % 5) * 100 + 50,
          y: Math.floor((i - 1) / 5) * 80 + 50,
          width: 60,
          height: 40,
          rotation: 0
        },
        equipment: {
          monitor: true,
          keyboard: true,
          mouse: true,
          webcam: false,
          headset: false
        },
        amenities: {
          near_window: i <= 5,
          near_kitchen: [3, 4, 7, 8].includes(i),
          power_outlets: 2,
          natural_light: i <= 5
        }
      });
    }

    // Floor 1-2 spaces (workstations and meeting rooms)
    for (let i = 1; i <= 15; i++) {
      spaces.push({
        floor_id: floor1_2.id,
        name: `Estação ${i}`,
        type: 'workstation',
        capacity: 1,
        description: `Estação de trabalho individual ${i}`,
        position: {
          x: (i % 5) * 100 + 50,
          y: Math.floor((i - 1) / 5) * 80 + 50,
          width: 60,
          height: 40,
          rotation: 0
        },
        equipment: {
          monitor: true,
          keyboard: true,
          mouse: true,
          webcam: true,
          headset: true
        },
        amenities: {
          near_window: [1, 2, 3, 4, 5, 11, 12, 13, 14, 15].includes(i),
          power_outlets: 4,
          natural_light: [1, 2, 3, 4, 5].includes(i),
          ergonomic_chair: true
        }
      });
    }

    // Meeting rooms on floor 1-2
    for (let i = 1; i <= 4; i++) {
      spaces.push({
        floor_id: floor1_2.id,
        name: `Sala de Reunião ${i}`,
        type: 'meeting_room',
        capacity: i <= 2 ? 6 : 10,
        description: `Sala de reunião para ${i <= 2 ? 6 : 10} pessoas`,
        position: {
          x: 600 + (i % 2) * 120,
          y: Math.floor((i - 1) / 2) * 100 + 50,
          width: 100,
          height: 80,
          rotation: 0
        },
        equipment: {
          projector: true,
          whiteboard: true,
          tv: true,
          phone: true,
          webcam: true
        },
        amenities: {
          air_conditioning: true,
          natural_light: i <= 2,
          near_kitchen: [2, 4].includes(i)
        },
        booking_rules: {
          min_duration_minutes: 30,
          max_duration_minutes: 240,
          requires_approval: i > 2
        }
      });
    }

    // Phone booths
    for (let i = 1; i <= 3; i++) {
      spaces.push({
        floor_id: floor1_2.id,
        name: `Cabine Telefônica ${i}`,
        type: 'phone_booth',
        capacity: 1,
        description: `Cabine para chamadas privadas ${i}`,
        position: {
          x: 50 + i * 80,
          y: 300,
          width: 40,
          height: 60,
          rotation: 0
        },
        equipment: {
          phone: true,
          webcam: true
        },
        amenities: {
          quiet_zone: true,
          air_conditioning: true
        },
        booking_rules: {
          min_duration_minutes: 15,
          max_duration_minutes: 60
        }
      });
    }

    // Executive spaces on floor 1-3
    for (let i = 1; i <= 3; i++) {
      spaces.push({
        floor_id: floor1_3.id,
        name: `Sala Executiva ${i}`,
        type: 'meeting_room',
        capacity: 8,
        description: `Sala executiva para reuniões de diretoria ${i}`,
        position: {
          x: i * 150,
          y: 100,
          width: 120,
          height: 100,
          rotation: 0
        },
        equipment: {
          projector: true,
          whiteboard: true,
          tv: true,
          phone: true,
          webcam: true
        },
        amenities: {
          air_conditioning: true,
          natural_light: true,
          ergonomic_chair: true
        },
        booking_rules: {
          min_duration_minutes: 60,
          max_duration_minutes: 480,
          requires_approval: true
        }
      });
    }

    // Lounge areas
    spaces.push({
      floor_id: floor1_3.id,
      name: 'Lounge Executivo',
      type: 'lounge',
      capacity: 12,
      description: 'Área de descanso e networking executivo',
      position: {
        x: 500,
        y: 100,
        width: 200,
        height: 150,
        rotation: 0
      },
      equipment: {
        tv: true
      },
      amenities: {
        near_kitchen: true,
        air_conditioning: true,
        natural_light: true
      },
      booking_rules: {
        min_duration_minutes: 30,
        max_duration_minutes: 120
      }
    });

    // Auditorium in building 2
    spaces.push({
      floor_id: floor2_1.id,
      name: 'Auditório Principal',
      type: 'meeting_room',
      capacity: 50,
      description: 'Auditório para grandes eventos e apresentações',
      position: {
        x: 100,
        y: 100,
        width: 300,
        height: 200,
        rotation: 0
      },
      equipment: {
        projector: true,
        tv: true,
        phone: true,
        webcam: true
      },
      amenities: {
        air_conditioning: true
      },
      booking_rules: {
        min_duration_minutes: 120,
        max_duration_minutes: 480,
        requires_approval: true
      }
    });

    // Event rooms in building 2
    for (let i = 1; i <= 3; i++) {
      spaces.push({
        floor_id: floor2_1.id,
        name: `Sala de Evento ${i}`,
        type: 'meeting_room',
        capacity: 20,
        description: `Sala para eventos e workshops ${i}`,
        position: {
          x: 500 + (i % 2) * 150,
          y: Math.floor((i - 1) / 2) * 120 + 50,
          width: 120,
          height: 100,
          rotation: 0
        },
        equipment: {
          projector: true,
          whiteboard: true,
          tv: true,
          phone: true
        },
        amenities: {
          air_conditioning: true,
          near_kitchen: true
        },
        booking_rules: {
          min_duration_minutes: 60,
          max_duration_minutes: 240,
          requires_approval: i === 1
        }
      });
    }

    // Create all spaces
    await models.Space.bulkCreate(spaces);
    console.log(`✅ ${spaces.length} espaços criados`);

    // Create sample users
    const users = [];
    const departments = ['TI', 'RH', 'Vendas', 'Marketing', 'Financeiro', 'Operações'];
    const names = [
      'Ana Silva', 'Carlos Santos', 'Maria Oliveira', 'João Pereira', 'Fernanda Costa',
      'Ricardo Lima', 'Juliana Alves', 'Pedro Rodrigues', 'Camila Ferreira', 'Lucas Martins',
      'Beatriz Souza', 'Rafael Carvalho', 'Larissa Gomes', 'Thiago Barbosa', 'Natália Dias'
    ];

    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const email = name.toLowerCase().replace(/\s+/g, '.').replace(/[áàâã]/g, 'a')
        .replace(/[éèê]/g, 'e').replace(/[íì]/g, 'i').replace(/[óòôõ]/g, 'o')
        .replace(/[úù]/g, 'u').replace(/ç/g, 'c') + '@empresa.com';

      users.push({
        name,
        email,
        password: 'user123',
        role: 'user',
        department: departments[i % departments.length],
        building_id: i < 10 ? building1.id : building2.id,
        phone: `(11) 9${String(i).padStart(4, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
      });
    }

    await models.User.bulkCreate(users);
    console.log(`✅ ${users.length} usuários criados`);

    // Create sample reservations
    const createdUsers = await models.User.findAll({ where: { role: 'user' } });
    const createdSpaces = await models.Space.findAll({ where: { is_bookable: true } });
    
    const reservations = [];
    const now = new Date();

    // Create reservations for the next 7 days
    for (let day = 0; day < 7; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() + day);
      date.setHours(8, 0, 0, 0);

      // Create 10-15 reservations per day
      const reservationsPerDay = Math.floor(Math.random() * 6) + 10;

      for (let i = 0; i < reservationsPerDay; i++) {
        const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
        const space = createdSpaces[Math.floor(Math.random() * createdSpaces.length)];
        
        const startHour = Math.floor(Math.random() * 9) + 8; // 8-16h
        const duration = [1, 2, 3, 4][Math.floor(Math.random() * 4)]; // 1-4 hours
        
        const startTime = new Date(date);
        startTime.setHours(startHour, 0, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + duration);

        // Check for conflicts
        const hasConflict = reservations.some(r => 
          r.space_id === space.id &&
          ((startTime >= new Date(r.start_time) && startTime < new Date(r.end_time)) ||
           (endTime > new Date(r.start_time) && endTime <= new Date(r.end_time)) ||
           (startTime <= new Date(r.start_time) && endTime >= new Date(r.end_time)))
        );

        if (!hasConflict) {
          const status = day === 0 && startTime < now ? 
            (Math.random() > 0.1 ? 'checked_in' : 'no_show') :
            'confirmed';

          reservations.push({
            user_id: user.id,
            space_id: space.id,
            start_time: startTime,
            end_time: endTime,
            status,
            title: `Reserva de ${user.name}`,
            description: `Uso do espaço ${space.name}`,
            attendees_count: space.type === 'meeting_room' ? Math.floor(Math.random() * space.capacity) + 1 : 1
          });
        }
      }
    }

    await models.Reservation.bulkCreate(reservations);
    console.log(`✅ ${reservations.length} reservas criadas`);

    // Create check-ins for checked-in reservations
    const checkedInReservations = await models.Reservation.findAll({
      where: { status: 'checked_in' }
    });

    const checkIns = checkedInReservations.map(reservation => ({
      user_id: reservation.user_id,
      reservation_id: reservation.id,
      check_in_time: new Date(reservation.start_time.getTime() + Math.random() * 15 * 60000), // Within 15 minutes
      method: 'qr_code'
    }));

    if (checkIns.length > 0) {
      await models.CheckIn.bulkCreate(checkIns);
      console.log(`✅ ${checkIns.length} check-ins criados`);
    }

    console.log('🎉 Seed concluído com sucesso!');
    console.log('\n📊 Resumo dos dados criados:');
    console.log(`- 1 usuário administrador (admin@workspace.com / admin123)`);
    console.log(`- ${users.length} usuários regulares (senha: user123)`);
    console.log(`- 2 prédios`);
    console.log(`- 4 andares`);
    console.log(`- ${spaces.length} espaços`);
    console.log(`- ${reservations.length} reservas`);
    console.log(`- ${checkIns.length} check-ins`);

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

// Run seed if called directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;
