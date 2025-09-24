import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tabs,
  Tab,
  Divider,
  CircularProgress
} from '@mui/material'
import {
  Search,
  FilterList,
  Add,
  Edit,
  Delete,
  Visibility,
  EventAvailable,
  Schedule,
  Cancel,
  CheckCircle,
  AccessTime,
  LocationOn,
  People,
  Computer,
  Tv,
  LocalCafe
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { format, isAfter, isBefore, addMinutes, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'

import { reservationService } from '../../services/reservationService'
import { useAuth } from '../../contexts/AuthContext'
import LoadingScreen from '../../components/Common/LoadingScreen'

// Dados mockados para demonstração
const mockReservations = [
  {
    id: '1',
    title: 'Reunião de Planejamento',
    start_time: '2025-09-24T09:00:00Z',
    end_time: '2025-09-24T10:30:00Z',
    status: 'confirmed',
    attendees_count: 5,
    description: 'Reunião mensal de planejamento da equipe',
    space: {
      id: '1',
      name: 'Sala Alpha',
      type: 'meeting_room',
      capacity: 8,
      floor: {
        name: '1º Andar',
        building: { name: 'Edifício Principal' }
      }
    }
  },
  {
    id: '2',
    title: 'Trabalho Focado',
    start_time: '2025-09-23T14:00:00Z',
    end_time: '2025-09-23T17:00:00Z',
    status: 'checked_in',
    attendees_count: 1,
    description: 'Sessão de trabalho concentrado',
    space: {
      id: '2',
      name: 'Estação 01',
      type: 'workstation',
      capacity: 1,
      floor: {
        name: '2º Andar',
        building: { name: 'Edifício Principal' }
      }
    }
  }
]

function MyReservationsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [reservationToCancel, setReservationToCancel] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [tabValue, setTabValue] = useState(0)

  // Fetch user's reservations
  const { data: reservationsData, isLoading, error } = useQuery(
    ['reservations', 'user', user?.id],
    () => reservationService.getMyReservations(),
    {
      enabled: !!user,
      onError: (error) => {
        toast.error('Erro ao carregar reservas')
        console.error('Reservations fetch error:', error)
      }
    }
  )

  // Cancel reservation mutation
  const cancelMutation = useMutation(
    ({ reservationId, reason }) => reservationService.cancelReservation(reservationId, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['reservations'])
        toast.success('Reserva cancelada com sucesso!')
        setCancelDialogOpen(false)
        setReservationToCancel(null)
        setCancelReason('')
        setDialogOpen(false)
      },
      onError: (error) => {
        toast.error(error.response?.data?.error?.message || 'Erro ao cancelar reserva')
      }
    }
  )

  const reservations = reservationsData?.data?.reservations || []

  const handleCancelReservation = (reservation) => {
    setReservationToCancel(reservation)
    setCancelDialogOpen(true)
  }

  const confirmCancelReservation = () => {
    if (reservationToCancel) {
      cancelMutation.mutate({
        reservationId: reservationToCancel.id,
        reason: cancelReason || 'Cancelado pelo usuário'
      })
    }
  }

  const getSpaceTypeIcon = (type) => {
    switch (type) {
      case 'workstation': return <Computer />
      case 'meeting_room': return <People />
      case 'conference_room': return <Tv />
      case 'phone_booth': return <LocalCafe />
      default: return <Computer />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success'
      case 'pending': return 'warning'
      case 'cancelled': return 'error'
      case 'completed': return 'info'
      case 'checked_in': return 'primary'
      default: return 'default'
    }
  }

  const getStatusLabel = (status) => {
    const labels = {
      confirmed: 'Confirmada',
      pending: 'Pendente',
      cancelled: 'Cancelada',
      completed: 'Concluída',
      checked_in: 'Check-in Realizado'
    }
    return labels[status] || status
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle />
      case 'pending': return <AccessTime />
      case 'cancelled': return <Cancel />
      case 'completed': return <EventAvailable />
      case 'checked_in': return <LocationOn />
      default: return <Schedule />
    }
  }

  const canCancelReservation = (reservation) => {
    if (reservation.status !== 'confirmed') return false
    
    // Can only cancel if reservation is at least 1 hour in the future
    const startTime = parseISO(reservation.start_time)
    const now = new Date()
    const oneHourFromNow = addMinutes(now, 60)
    
    return isAfter(startTime, oneHourFromNow)
  }

  const canCheckIn = (reservation) => {
    if (reservation.status !== 'confirmed') {
      console.log('Check-in não disponível - Status:', reservation.status)
      return false
    }

    const now = new Date()
    const startTime = parseISO(reservation.start_time)
    const endTime = parseISO(reservation.end_time)
    const checkInWindow = addMinutes(startTime, -15) // 15 min antes

    console.log('Check-in debug:', {
      now: now.toISOString(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      checkInWindow: checkInWindow.toISOString(),
      canCheckIn: isAfter(now, checkInWindow) && isBefore(now, endTime)
    })

    // Regra original para produção
    const isWithinOriginalWindow = isAfter(now, checkInWindow) && isBefore(now, endTime)

    // Regra flexível para desenvolvimento - permite check-in em reservas das próximas 24 horas
    const twentyFourHoursFromNow = addMinutes(now, 24 * 60)
    const isWithinTestWindow = isBefore(startTime, twentyFourHoursFromNow) && isAfter(endTime, now)

    return isWithinOriginalWindow || isWithinTestWindow
  }

  const formatDate = (dateString) => {
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR })
  }

  const formatTime = (dateString) => {
    return format(parseISO(dateString), 'HH:mm', { locale: ptBR })
  }

  const formatDateTime = (dateString) => {
    return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR })
  }

  const filterReservations = (reservations, tab) => {
    let filtered = reservations
    const now = new Date()

    // Filter by tab
    switch (tab) {
      case 0: // Próximas
        filtered = filtered.filter(r => {
          const startTime = parseISO(r.start_time)
          return (r.status === 'confirmed' || r.status === 'pending') && isAfter(startTime, now)
        })
        break
      case 1: // Hoje
        filtered = filtered.filter(r => {
          const startTime = parseISO(r.start_time)
          const today = format(now, 'yyyy-MM-dd')
          const reservationDate = format(startTime, 'yyyy-MM-dd')
          return reservationDate === today
        })
        break
      case 2: // Histórico
        filtered = filtered.filter(r => {
          const endTime = parseISO(r.end_time)
          return r.status === 'completed' || r.status === 'cancelled' || isBefore(endTime, now)
        })
        break
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.space?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.space?.floor?.building?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus)
    }

    return filtered
  }

  const filteredReservations = filterReservations(reservations, tabValue)

  if (isLoading) return <LoadingScreen />

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Erro ao carregar reservas: {error.response?.data?.error?.message || error.message}
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Minhas Reservas
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/reservations/new')}
        >
          Nova Reserva
        </Button>
      </Box>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Próximas" />
          <Tab label="Hoje" />
          <Tab label="Histórico" />
        </Tabs>
      </Card>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Buscar reservas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">Todos os Status</MenuItem>
                  <MenuItem value="confirmed">Confirmada</MenuItem>
                  <MenuItem value="pending">Pendente</MenuItem>
                  <MenuItem value="checked_in">Check-in Realizado</MenuItem>
                  <MenuItem value="completed">Concluída</MenuItem>
                  <MenuItem value="cancelled">Cancelada</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('')
                  setFilterStatus('all')
                }}
              >
                Limpar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lista de Reservas */}
      {isLoading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Carregando reservas...</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredReservations.map((reservation) => (
            <Grid item xs={12} key={reservation.id}>
              <Card>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={1}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {reservation.space && getSpaceTypeIcon(reservation.space.type)}
                      </Avatar>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Typography variant="h6" component="div">
                        {reservation.purpose || reservation.space?.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {reservation.space?.floor?.building?.name} - {reservation.space?.floor?.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {reservation.space?.name}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Schedule sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="body2">
                          {formatDate(reservation.start_time)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={2}>
                      <Chip
                        icon={getStatusIcon(reservation.status)}
                        label={getStatusLabel(reservation.status)}
                        color={getStatusColor(reservation.status)}
                        size="small"
                      />
                    </Grid>

                    <Grid item xs={12} md={2}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Detalhes">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedReservation(reservation)
                              setDialogOpen(true)
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        
                        {canCheckIn(reservation) && (
                          <Tooltip title="Check-in">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/check-in/${reservation.space.id}`)}
                            >
                              <LocationOn />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {canCancelReservation(reservation) && (
                          <Tooltip title="Cancelar">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleCancelReservation(reservation)}
                            >
                              <Cancel />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {filteredReservations.length === 0 && !isLoading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            Nenhuma reserva encontrada
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tabValue === 0 && 'Você não tem reservas próximas'}
            {tabValue === 1 && 'Você não tem reservas para hoje'}
            {tabValue === 2 && 'Você não tem histórico de reservas'}
          </Typography>
        </Box>
      )}

      {/* Dialog de Detalhes */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedReservation && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  {selectedReservation.space && getSpaceTypeIcon(selectedReservation.space.type)}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedReservation.purpose || selectedReservation.space?.name}
                  </Typography>
                  <Chip
                    icon={getStatusIcon(selectedReservation.status)}
                    label={getStatusLabel(selectedReservation.status)}
                    color={getStatusColor(selectedReservation.status)}
                    size="small"
                  />
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Informações da Reserva</Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Data:</strong> {formatDate(selectedReservation.start_time)}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Horário:</strong> {formatTime(selectedReservation.start_time)} - {formatTime(selectedReservation.end_time)}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Participantes:</strong> {selectedReservation.guests_count || 1} pessoas
                  </Typography>
                  {selectedReservation.purpose && (
                    <Typography variant="body2" paragraph>
                      <strong>Finalidade:</strong> {selectedReservation.purpose}
                    </Typography>
                  )}
                  {selectedReservation.notes && (
                    <Typography variant="body2" paragraph>
                      <strong>Observações:</strong> {selectedReservation.notes}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Espaço</Typography>
                  {selectedReservation.space && (
                    <>
                      <Typography variant="body2">
                        <strong>Nome:</strong> {selectedReservation.space.name}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Tipo:</strong> {selectedReservation.space.type}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Capacidade:</strong> {selectedReservation.space.capacity} pessoas
                      </Typography>
                      <Typography variant="body2">
                        <strong>Localização:</strong> {selectedReservation.space.floor?.building?.name} - {selectedReservation.space.floor?.name}
                      </Typography>
                    </>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Fechar</Button>
              {canCheckIn(selectedReservation) && (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => {
                    navigate(`/check-in/${selectedReservation.space.id}`)
                    setDialogOpen(false)
                  }}
                >
                  Fazer Check-in
                </Button>
              )}
              {canCancelReservation(selectedReservation) && (
                <Button 
                  variant="contained" 
                  color="error"
                  onClick={() => {
                    handleCancelReservation(selectedReservation)
                    setDialogOpen(false)
                  }}
                >
                  Cancelar Reserva
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Cancel Reservation Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Cancel sx={{ mr: 1, color: 'error.main' }} />
            Cancelar Reserva
          </Box>
        </DialogTitle>
        <DialogContent>
          {reservationToCancel && (
            <Box>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Atenção:</strong> Esta ação não pode ser desfeita. A reserva será cancelada permanentemente.
                </Typography>
              </Alert>
              
              <Typography variant="h6" gutterBottom>
                {reservationToCancel.purpose || reservationToCancel.space?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {formatDateTime(reservationToCancel.start_time)} - {formatTime(reservationToCancel.end_time)}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {reservationToCancel.space?.floor?.building?.name} - {reservationToCancel.space?.name}
              </Typography>

              <TextField
                fullWidth
                label="Motivo do cancelamento (opcional)"
                multiline
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                margin="normal"
                placeholder="Informe o motivo do cancelamento..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setCancelDialogOpen(false)
              setReservationToCancel(null)
              setCancelReason('')
            }}
          >
            Manter Reserva
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={confirmCancelReservation}
            disabled={cancelMutation.isLoading}
            startIcon={cancelMutation.isLoading ? <CircularProgress size={20} /> : <Cancel />}
          >
            {cancelMutation.isLoading ? 'Cancelando...' : 'Confirmar Cancelamento'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MyReservationsPage
