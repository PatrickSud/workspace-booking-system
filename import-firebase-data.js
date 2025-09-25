// Script simplificado para importar dados para o Firebase
// Este script usa fetch para fazer requisições HTTP diretas para o Firestore REST API

const fs = require('fs')
const https = require('https')

// Configuração do Firebase
const PROJECT_ID = 'workspace-booking-system'
const API_KEY = 'AIzaSyDYNdLXJkZl2t0_0NKLDb-I-bx12DGuiNo'

// Função para fazer requisições HTTPS
function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, res => {
      let body = ''
      res.on('data', chunk => (body += chunk))
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) })
        } catch (e) {
          resolve({ status: res.statusCode, body: body })
        }
      })
    })

    req.on('error', reject)

    if (data) {
      req.write(JSON.stringify(data))
    }

    req.end()
  })
}

// Função para obter token de acesso
async function getAccessToken() {
  console.log('🔑 Obtendo token de acesso...')

  const tokenUrl = 'https://oauth2.googleapis.com/token'
  const tokenData = {
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion: generateJWT()
  }

  const response = await makeRequest(
    tokenUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    },
    tokenData
  )

  if (response.status === 200) {
    return response.body.access_token
  } else {
    throw new Error('Erro ao obter token: ' + response.body)
  }
}

// Função para gerar JWT (simplificada)
function generateJWT() {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  }

  const payload = {
    iss: 'firebase-adminsdk-fbsvc@workspace-booking-system.iam.gserviceaccount.com',
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000)
  }

  // Esta é uma versão simplificada - em produção você precisaria usar uma biblioteca JWT
  console.log('⚠️  Esta versão simplificada não pode gerar JWT válido')
  console.log('📋 Use o método alternativo abaixo:')
  return null
}

// Função para importar dados usando o método alternativo
async function importDataAlternative() {
  console.log('🚀 Iniciando importação de dados...')
  console.log('')
  console.log('📋 MÉTODO ALTERNATIVO - Execute os seguintes passos:')
  console.log('')
  console.log('1️⃣  Acesse o Firebase Console:')
  console.log(
    '   https://console.firebase.google.com/project/workspace-booking-system/firestore'
  )
  console.log('')
  console.log('2️⃣  Crie as collections manualmente:')
  console.log('   - users')
  console.log('   - buildings')
  console.log('')
  console.log('3️⃣  Importe os dados do arquivo firestore-data.json:')
  console.log('   - Copie o conteúdo do arquivo firestore-data.json')
  console.log('   - Cole diretamente no Firestore Console')
  console.log('')
  console.log('4️⃣  Ou use o Firebase CLI (se estiver funcionando):')
  console.log(
    '   firebase firestore:import firestore-data.json --project workspace-booking-system'
  )
  console.log('')

  // Mostrar os dados que devem ser importados
  try {
    const data = JSON.parse(fs.readFileSync('firestore-data.json', 'utf8'))
    console.log('📊 DADOS PARA IMPORTAR:')
    console.log('')

    console.log('👥 USUÁRIOS:')
    Object.entries(data.users).forEach(([id, user]) => {
      console.log(`   ID: ${id}`)
      console.log(`   Nome: ${user.name}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Role: ${user.role}`)
      console.log('')
    })

    console.log('🏢 PRÉDIOS:')
    Object.entries(data.buildings).forEach(([id, building]) => {
      console.log(`   ID: ${id}`)
      console.log(`   Nome: ${building.name}`)
      console.log(`   Endereço: ${building.address}`)
      console.log(`   Cidade: ${building.city}`)
      console.log('')
    })
  } catch (error) {
    console.log('❌ Erro ao ler arquivo firestore-data.json:', error.message)
  }
}

// Executar importação
importDataAlternative()
