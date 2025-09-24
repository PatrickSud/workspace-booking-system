import React, { useState } from 'react'
import { 
  Box, 
  Button, 
  Typography, 
  TextField, 
  Card, 
  CardContent, 
  Grid,
  Chip,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper
} from '@mui/material'
import {
  CheckCircle,
  Error,
  Warning,
  Info,
  Storage,
  Api,
  Security,
  Speed,
  BugReport
} from '@mui/icons-material'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

const TestPage = () => {
  const [result, setResult] = useState('')
  const [token, setToken] = useState('')
  const [testResults, setTestResults] = useState({})
  const [isRunning, setIsRunning] = useState(false)
  const { user } = useAuth()

  const testLogin = async () => {
    try {
      const response = await axios.post('http://localhost:3002/api/auth/login', {
        email: 'admin@workspace.com',
        password: 'admin123'
      })
      setResult(JSON.stringify(response.data, null, 2))
      if (response.data.data && response.data.data.token) {
        setToken(response.data.data.token)
        localStorage.setItem('token', response.data.data.token)
        setResult(prev => prev + '\n\n✅ Token salvo: ' + response.data.data.token.substring(0, 50) + '...')
      } else if (response.data.token) {
        setToken(response.data.token)
        localStorage.setItem('token', response.data.token)
        setResult(prev => prev + '\n\n✅ Token salvo: ' + response.data.token.substring(0, 50) + '...')
      } else {
        setResult(prev => prev + '\n\n❌ Nenhum token encontrado na resposta')
      }
    } catch (error) {
      setResult(`Erro: ${error.message}\n${JSON.stringify(error.response?.data, null, 2)}`)
    }
  }

  const testSpaces = async () => {
    try {
      const currentToken = token || localStorage.getItem('token')
      setResult(`🔍 Usando token: ${currentToken ? currentToken.substring(0, 50) + '...' : 'NENHUM TOKEN'}\n\n`)
      
      const response = await axios.get('http://localhost:3002/api/spaces', {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      })
      setResult(prev => prev + JSON.stringify(response.data, null, 2))
    } catch (error) {
      const currentToken = token || localStorage.getItem('token')
      setResult(`❌ Erro: ${error.message}
🔍 Token usado: ${currentToken ? currentToken.substring(0, 50) + '...' : 'NENHUM TOKEN'}
📋 Resposta do servidor:
${JSON.stringify(error.response?.data, null, 2)}`)
    }
  }

  const testHealth = async () => {
    try {
      const response = await axios.get('http://localhost:3002/health')
      setResult(JSON.stringify(response.data, null, 2))
    } catch (error) {
      setResult(`Erro: ${error.message}`)
    }
  }

  const checkLocalStorage = () => {
    const storedToken = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    setResult(`🔍 LocalStorage:
Token: ${storedToken ? storedToken.substring(0, 50) + '...' : 'NENHUM TOKEN'}
User: ${user || 'NENHUM USUÁRIO'}

📋 Todos os itens do localStorage:
${Object.keys(localStorage).map(key => `${key}: ${localStorage.getItem(key)?.substring(0, 100)}...`).join('\n')}`)
  }

  // Novos testes mais abrangentes
  const testBuildings = async () => {
    try {
      const currentToken = token || localStorage.getItem('token')
      const response = await axios.get('http://localhost:3002/api/buildings', {
        headers: { Authorization: `Bearer ${currentToken}` }
      })
      setResult(`✅ Prédios carregados: ${response.data.data?.buildings?.length || 0} prédios\n\n${JSON.stringify(response.data, null, 2)}`)
    } catch (error) {
      setResult(`❌ Erro ao carregar prédios: ${error.message}\n${JSON.stringify(error.response?.data, null, 2)}`)
    }
  }

  const testFloors = async () => {
    try {
      const currentToken = token || localStorage.getItem('token')
      const response = await axios.get('http://localhost:3002/api/floors', {
        headers: { Authorization: `Bearer ${currentToken}` }
      })
      setResult(`✅ Andares carregados: ${response.data.data?.floors?.length || 0} andares\n\n${JSON.stringify(response.data, null, 2)}`)
    } catch (error) {
      setResult(`❌ Erro ao carregar andares: ${error.message}\n${JSON.stringify(error.response?.data, null, 2)}`)
    }
  }

  const testReservations = async () => {
    try {
      const currentToken = token || localStorage.getItem('token')
      const response = await axios.get('http://localhost:3002/api/reservations', {
        headers: { Authorization: `Bearer ${currentToken}` }
      })
      setResult(`✅ Reservas carregadas: ${response.data.data?.reservations?.length || 0} reservas\n\n${JSON.stringify(response.data, null, 2)}`)
    } catch (error) {
      setResult(`❌ Erro ao carregar reservas: ${error.message}\n${JSON.stringify(error.response?.data, null, 2)}`)
    }
  }

  const testUsers = async () => {
    try {
      const currentToken = token || localStorage.getItem('token')
      const response = await axios.get('http://localhost:3002/api/users', {
        headers: { Authorization: `Bearer ${currentToken}` }
      })
      setResult(`✅ Usuários carregados: ${response.data.data?.users?.length || 0} usuários\n\n${JSON.stringify(response.data, null, 2)}`)
    } catch (error) {
      setResult(`❌ Erro ao carregar usuários: ${error.message}\n${JSON.stringify(error.response?.data, null, 2)}`)
    }
  }

  const testCreateReservation = async () => {
    try {
      const currentToken = token || localStorage.getItem('token')
      
      // Primeiro, pegar um espaço disponível
      const spacesResponse = await axios.get('http://localhost:3002/api/spaces?is_bookable=true', {
        headers: { Authorization: `Bearer ${currentToken}` }
      })
      
      if (!spacesResponse.data.data?.spaces?.length) {
        setResult('❌ Nenhum espaço disponível para teste')
        return
      }

      const testSpace = spacesResponse.data.data.spaces[0]
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)
      
      const endTime = new Date(tomorrow)
      endTime.setHours(10, 30, 0, 0) // 30 minutos de duração

      const reservationData = {
        space_id: testSpace.id,
        start_time: tomorrow.toISOString(),
        end_time: endTime.toISOString(),
        purpose: 'Teste automatizado do sistema',
        notes: 'Reserva criada pelo sistema de testes'
      }

      const response = await axios.post('http://localhost:3002/api/reservations', reservationData, {
        headers: { Authorization: `Bearer ${currentToken}` }
      })
      
      setResult(`✅ Reserva de teste criada com sucesso!\nEspaço: ${testSpace.name}\nHorário: ${tomorrow.toLocaleString()}\n\n${JSON.stringify(response.data, null, 2)}`)
    } catch (error) {
      setResult(`❌ Erro ao criar reserva de teste: ${error.message}\n${JSON.stringify(error.response?.data, null, 2)}`)
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    const tests = [
      { name: 'Health Check', fn: testHealth },
      { name: 'Login', fn: testLogin },
      { name: 'Espaços', fn: testSpaces },
      { name: 'Prédios', fn: testBuildings },
      { name: 'Andares', fn: testFloors },
      { name: 'Reservas', fn: testReservations },
      { name: 'Usuários', fn: testUsers }
    ]

    const results = {}
    
    for (const test of tests) {
      try {
        setResult(`🔄 Executando: ${test.name}...`)
        await test.fn()
        results[test.name] = { status: 'success', message: 'Teste passou' }
        await new Promise(resolve => setTimeout(resolve, 1000)) // Pausa entre testes
      } catch (error) {
        results[test.name] = { status: 'error', message: error.message }
      }
    }
    
    setTestResults(results)
    setIsRunning(false)
    setResult(`🎉 Todos os testes executados!\n\n${JSON.stringify(results, null, 2)}`)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle color="success" />
      case 'error': return <Error color="error" />
      case 'warning': return <Warning color="warning" />
      default: return <Info color="info" />
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <BugReport sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" gutterBottom>
            Painel de Testes do Sistema
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Ferramenta de diagnóstico e validação da aplicação
          </Typography>
        </Box>
      </Box>

      {user && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Usuário logado:</strong> {user.name} ({user.email}) - {user.role}
          </Typography>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Testes Básicos */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Api sx={{ mr: 1 }} />
                <Typography variant="h6">Testes de API</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Button variant="contained" size="small" onClick={testHealth}>
                  Health
                </Button>
                <Button variant="contained" size="small" onClick={testLogin}>
                  Login
                </Button>
                <Button variant="contained" size="small" onClick={testSpaces}>
                  Espaços
                </Button>
                <Button variant="contained" size="small" onClick={testBuildings}>
                  Prédios
                </Button>
                <Button variant="contained" size="small" onClick={testFloors}>
                  Andares
                </Button>
                <Button variant="contained" size="small" onClick={testReservations}>
                  Reservas
                </Button>
                <Button variant="contained" size="small" onClick={testUsers}>
                  Usuários
                </Button>
              </Box>
              <Button 
                variant="outlined" 
                fullWidth 
                onClick={runAllTests}
                disabled={isRunning}
                startIcon={<Speed />}
              >
                {isRunning ? 'Executando Testes...' : 'Executar Todos os Testes'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Testes Avançados */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Security sx={{ mr: 1 }} />
                <Typography variant="h6">Testes Avançados</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Button variant="outlined" size="small" onClick={checkLocalStorage}>
                  LocalStorage
                </Button>
                <Button variant="outlined" size="small" onClick={testCreateReservation}>
                  Criar Reserva
                </Button>
              </Box>
              <TextField
                fullWidth
                label="Token Manual"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                size="small"
                helperText="Token JWT para testes manuais"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Resultados dos Testes */}
        {Object.keys(testResults).length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Storage sx={{ mr: 1 }} />
                  <Typography variant="h6">Resumo dos Testes</Typography>
                </Box>
                <List dense>
                  {Object.entries(testResults).map(([testName, result]) => (
                    <ListItem key={testName}>
                      <ListItemIcon>
                        {getStatusIcon(result.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={testName}
                        secondary={result.message}
                      />
                      <Chip 
                        label={result.status} 
                        color={result.status === 'success' ? 'success' : 'error'}
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Resultado Detalhado */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resultado Detalhado:
              </Typography>
              <Paper 
                sx={{ 
                  p: 2, 
                  backgroundColor: 'grey.50', 
                  maxHeight: 400, 
                  overflow: 'auto' 
                }}
              >
                <pre style={{ 
                  whiteSpace: 'pre-wrap', 
                  fontSize: '12px', 
                  margin: 0,
                  fontFamily: 'monospace'
                }}>
                  {result || 'Nenhum teste executado ainda...'}
                </pre>
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default TestPage
