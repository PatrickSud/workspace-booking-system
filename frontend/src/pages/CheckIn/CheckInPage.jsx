import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Chip,
  Paper,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material'
import {
  QrCodeScanner,
  CheckCircle,
  LocationOn,
  Schedule,
  Person,
  EventSeat,
  Computer,
  MeetingRoom,
  Tv,
  Phone,
  Weekend,
  Psychology,
  Warning,
  Error,
  AccessTime,
  Today
} from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { format, isAfter, isBefore, addMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { spaceService } from '../../services/spaceService'
import { reservationService } from '../../services/reservationService'
import { useAuth } from '../../contexts/AuthContext'
import LoadingScreen from '../../components/Common/LoadingScreen'

const CheckInPage = () => {
  const { spaceId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  const [step, setStep] = useState(0) // 0: Loading, 1: Space Info, 2: Check-in Form, 3: Success
  const [checkInData, setCheckInData] = useState(null)
  const [currentReservation, setCurrentReservation] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm()

  // Fetch space details
  const { data: spaceData, isLoading: spaceLoading } = useQuery(
    ['space', spaceId],
    () => spaceService.getSpaceById(spaceId),
    {
      enabled: !!spaceId,
      onSuccess: (data) => {
        if (data?.data?.space) {
          setStep(1)
        }
      },
      onError: (error) => {
        toast.error('Erro ao carregar informações do espaço')
        console.error('Space fetch error:', error)
      }
    }
  )

  // Fetch current reservations for this space
  const { data: reservationsData } = useQuery(
    ['reservations', 'space', spaceId],
    () => reservationService.getReservations({
      space_id: spaceId,
      status: 'confirmed',
      date: format(new Date(), 'yyyy-MM-dd')
    }),
    {
      enabled: !!spaceId,
      onSuccess: (data) => {
        const reservations = data?.data?.reservations || []
        const now = new Date()
        
        // Find current or upcoming reservation
        const activeReservation = reservations.find(reservation => {
          const startTime = new Date(reservation.start_time)
          const endTime = new Date(reservation.end_time)
          const checkInWindow = addMinutes(startTime, -15) // 15 min before
          
          return isAfter(now, checkInWindow) && isBefore(now, endTime)
        })
        
        setCurrentReservation(activeReservation)
      }
    }
  )

  // Check-in mutation
  const checkInMutation = useMutation(
    (data) => spaceService.checkIn(spaceId, data),
    {
      onSuccess: (data) => {
        setCheckInData(data.data)
        setStep(3)
        queryClient.invalidateQueries(['reservations'])
        toast.success('Check-in realizado com sucesso!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.error?.message || 'Erro ao realizar check-in')
      }
    }
  )

  const space = spaceData?.data?.space
  const reservations = reservationsData?.data?.reservations || []

  const getSpaceTypeIcon = (type) => {
    switch (type) {
      case 'workstation': return <Computer />
      case 'meeting_room': return <MeetingRoom />
      case 'conference_room': return <Tv />
      case 'phone_booth': return <Phone />
      case 'lounge': return <Weekend />
      case 'focus_room': return <Psychology />
      default: return <EventSeat />
    }
  }

  const getSpaceTypeLabel = (type) => {
    const labels = {
      workstation: 'Estação de Trabalho',
      meeting_room: 'Sala de Reunião',
      conference_room: 'Sala de Conferência',
      phone_booth: 'Cabine Telefônica',
      lounge: 'Lounge',
      focus_room: 'Sala de Foco'
    }
    return labels[type] || type
  }

  const onCheckInSubmit = (data) => {
    const checkInPayload = {
      reservation_id: currentReservation?.id,
      notes: data.notes,
      location: {
        method: 'qr_code',
        coordinates: null
      },
      device_info: {
        user_agent: navigator.userAgent,
        ip_address: null,
        device_type: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop'
      }
    }
    
    checkInMutation.mutate(checkInPayload)
  }

  const canCheckIn = () => {
    if (!currentReservation) return false
    if (!user) return false
    
    const now = new Date()
    const startTime = new Date(currentReservation.start_time)
    const endTime = new Date(currentReservation.end_time)
    const checkInWindow = addMinutes(startTime, -15) // 15 min before
    
    return isAfter(now, checkInWindow) && isBefore(now, endTime)
  }

  const getCheckInStatus = () => {
    if (!currentReservation) {
      return {
        status: 'no_reservation',
        message: 'Nenhuma reserva ativa encontrada para este espaço no momento.',
        color: 'warning'
      }
    }
    
    if (!user) {
      return {
        status: 'not_logged_in',
        message: 'Você precisa estar logado para fazer check-in.',
        color: 'error'
      }
    }
    
    if (currentReservation.user_id !== user.id) {
      return {
        status: 'not_your_reservation',
        message: 'Esta reserva pertence a outro usuário.',
        color: 'error'
      }
    }
    
    if (canCheckIn()) {
      return {
        status: 'can_check_in',
        message: 'Você pode fazer check-in agora!',
        color: 'success'
      }
    }
    
    return {
      status: 'outside_window',
      message: 'Check-in disponível 15 minutos antes do horário da reserva.',
      color: 'info'
    }
  }

  if (spaceLoading || step === 0) return <LoadingScreen />

  if (!space) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error">
          <Typography variant="h6" gutterBottom>
            Espaço não encontrado
          </Typography>
          <Typography variant="body2">
            O espaço solicitado não foi encontrado ou não está disponível.
          </Typography>
        </Alert>
      </Box>
    )
  }

  const checkInStatus = getCheckInStatus()

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <QrCodeScanner sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Check-in
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Confirme sua presença no espaço
        </Typography>
      </Box>

      {/* Progress Stepper */}
      <Stepper activeStep={step - 1} sx={{ mb: 4 }}>
        <Step>
          <StepLabel>Informações do Espaço</StepLabel>
        </Step>
        <Step>
          <StepLabel>Check-in</StepLabel>
        </Step>
        <Step>
          <StepLabel>Confirmação</StepLabel>
        </Step>
      </Stepper>

      {/* Step 1: Space Information */}
      {step === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                {getSpaceTypeIcon(space.type)}
              </Avatar>
              <Box>
                <Typography variant="h6">{space.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {getSpaceTypeLabel(space.type)} • {space.capacity} pessoas
                </Typography>
              </Box>
            </Box>

            <List dense>
              <ListItem>
                <ListItemAvatar>
                  <Avatar size="small">
                    <LocationOn />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="Localização"
                  secondary={`${space.floor?.building?.name} - ${space.floor?.name}`}
                />
              </ListItem>
              {space.description && (
                <ListItem>
                  <ListItemText
                    primary="Descrição"
                    secondary={space.description}
                  />
                </ListItem>
              )}
            </List>

            <Divider sx={{ my: 2 }} />

            {/* Current Reservation Info */}
            {currentReservation ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Reserva Atual
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Today sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">
                          {format(new Date(currentReservation.start_time), 'dd/MM/yyyy', { locale: ptBR })}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AccessTime sx={{ mr: 1, fontSize: 20 }} />
                        <Typography variant="body2">
                          {format(new Date(currentReservation.start_time), 'HH:mm')} - {format(new Date(currentReservation.end_time), 'HH:mm')}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Finalidade:</strong> {currentReservation.purpose}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Box>
            ) : (
              <Alert severity="warning">
                Nenhuma reserva ativa encontrada para este espaço.
              </Alert>
            )}

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Alert severity={checkInStatus.color} sx={{ mb: 2 }}>
                {checkInStatus.message}
              </Alert>
              
              {checkInStatus.status === 'can_check_in' ? (
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => setStep(2)}
                  startIcon={<CheckCircle />}
                >
                  Fazer Check-in
                </Button>
              ) : checkInStatus.status === 'not_logged_in' ? (
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/login')}
                >
                  Fazer Login
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  onClick={() => navigate('/dashboard')}
                >
                  Voltar ao Dashboard
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Check-in Form */}
      {step === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Confirmar Check-in
            </Typography>
            
            <Box component="form" onSubmit={handleSubmit(onCheckInSubmit)}>
              <TextField
                fullWidth
                label="Observações (opcional)"
                multiline
                rows={3}
                margin="normal"
                placeholder="Adicione observações sobre sua chegada..."
                {...register('notes')}
              />

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => setStep(1)}
                  fullWidth
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={checkInMutation.isLoading}
                  startIcon={checkInMutation.isLoading ? <CircularProgress size={20} /> : <CheckCircle />}
                >
                  {checkInMutation.isLoading ? 'Fazendo Check-in...' : 'Confirmar Check-in'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Success */}
      {step === 3 && (
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Check-in Realizado!
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Sua presença foi confirmada com sucesso.
            </Typography>
            
            {checkInData && (
              <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.50' }}>
                <Typography variant="body2">
                  <strong>Horário do Check-in:</strong> {format(new Date(checkInData.check_in_time), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </Typography>
              </Paper>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/my-reservations')}
                fullWidth
              >
                Minhas Reservas
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/dashboard')}
                fullWidth
              >
                Dashboard
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default CheckInPage
