import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab,
  Tooltip,
  Badge,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  CircularProgress
} from '@mui/material'
import {
  ArrowBack,
  Edit,
  Add,
  EventSeat,
  Computer,
  MeetingRoom,
  Tv,
  Phone,
  Weekend,
  Psychology,
  People,
  Schedule,
  LocationOn,
  QrCode,
  Visibility,
  Delete,
  CheckCircle,
  Cancel,
  Warning,
  Layers,
  Business,
  CalendarToday,
  AccessTime,
  Person,
  Event,
  History,
  Today
} from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { format, parseISO, isAfter, isBefore, addMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { spaceService } from '../../services/spaceService'
import { reservationService } from '../../services/reservationService'
import { useAuth } from '../../contexts/AuthContext'
import LoadingScreen from '../../components/Common/LoadingScreen'

const SpaceDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAdmin } = useAuth()

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [selectedReservation, setSelectedReservation] = useState(null)
  const [reservationDialogOpen, setReservationDialogOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm()

  // Fetch space details
  const { data: spaceData, isLoading: spaceLoading } = useQuery(
    ['space', id],
    () => spaceService.getSpaceById(id),
    {
      enabled: !!id,
      onError: (error) => {
        toast.error('Erro ao carregar detalhes do espaço')
        console.error('Space fetch error:', error)
      }
    }
  )

  // Fetch reservations for this space
  const { data: reservationsData, isLoading: reservationsLoading } = useQuery(
    ['reservations', 'space', id],
    () => reservationService.getReservations({
      space_id: id,
      date: format(new Date(), 'yyyy-MM-dd')
    }),
    {
      enabled: !!id,
      onError: (error) => {
        toast.error('Erro ao carregar reservas do espaço')
        console.error('Reservations fetch error:', error)
      }
    }
  )

  // Update space mutation
  const updateSpaceMutation = useMutation(
    (data) => spaceService.updateSpace(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['space', id])
        toast.success('Espaço atualizado com sucesso!')
        setEditDialogOpen(false)
        reset()
      },
      onError: (error) => {
        toast.error(error.response?.data?.error?.message || 'Erro ao atualizar espaço')
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

  const getSpaceStatusColor = (space) => {
    if (!space.is_active) return 'error'
    if (!space.is_bookable) return 'warning'
    return 'success'
  }

  const getSpaceStatusText = (space) => {
    if (!space.is_active) return 'Inativo'
    if (!space.is_bookable) return 'Não Reservável'
    return 'Ativo'
  }

  const getReservationStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'success'
      case 'pending': return 'warning'
      case 'cancelled': return 'error'
      case 'completed': return 'info'
      case 'checked_in': return 'primary'
      default: return 'default'
    }
  }

  const getReservationStatusText = (status) => {
    const labels = {
      confirmed: 'Confirmada',
      pending: 'Pendente',
      cancelled: 'Cancelada',
      completed: 'Concluída',
      checked_in: 'Check-in Realizado'
    }
    return labels[status] || status
  }

  const getReservationStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle />
      case 'pending': return <Schedule />
      case 'cancelled': return <Cancel />
      case 'completed': return <Event />
      case 'checked_in': return <LocationOn />
      default: return <Schedule />
    }
  }

  const canCheckIn = (reservation) => {
    if (reservation.status !== 'confirmed') return false

    const now = new Date()
    const startTime = parseISO(reservation.start_time)
    const endTime = parseISO(reservation.end_time)
    const checkInWindow = addMinutes(startTime, -15) // 15 min before

    return isAfter(now, checkInWindow) && isBefore(now, endTime)
  }

  const onEditSubmit = (data) => {
    updateSpaceMutation.mutate({
      ...data,
      capacity: parseInt(data.capacity),
      is_bookable: data.is_bookable === 'true',
      is_active: data.is_active === 'true'
    })
  }

  const openEditDialog = () => {
    setValue('name', space.name)
    setValue('description', space.description || '')
    setValue('capacity', space.capacity)
    setValue('type', space.type)
    setValue('is_bookable', space.is_bookable.toString())
    setValue('is_active', space.is_active.toString())
    setEditDialogOpen(true)
  }

  if (spaceLoading) return <LoadingScreen />

  if (!space) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Espaço não encontrado
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1">
            {space.name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {getSpaceTypeLabel(space.type)} • {space.capacity} pessoas
          </Typography>
        </Box>
        {isAdmin && (
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={openEditDialog}
          >
            Editar
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Space Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informações do Espaço
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      {getSpaceTypeIcon(space.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Tipo"
                    secondary={getSpaceTypeLabel(space.type)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <People />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Capacidade"
                    secondary={`${space.capacity} pessoas`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <Layers />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Andar"
                    secondary={space.floor?.name}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <Business />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Prédio"
                    secondary={space.floor?.building?.name}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Status"
                    secondary={
                      <Chip
                        label={getSpaceStatusText(space)}
                        color={getSpaceStatusColor(space)}
                        size="small"
                      />
                    }
                  />
                </ListItem>
              </List>

              {space.description && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    {space.description}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Reservations and Actions */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Reservas de Hoje ({reservations.length})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/reservations/new')}
                >
                  Nova Reserva
                </Button>
              </Box>

              {reservationsLoading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography>Carregando reservas...</Typography>
                </Box>
              ) : reservations.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <EventSeat sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Nenhuma reserva hoje
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Este espaço está disponível para reserva.
                  </Typography>
                </Box>
              ) : (
                <List>
                  {reservations.map((reservation, index) => (
                    <React.Fragment key={reservation.id}>
                      <ListItem
                        button
                        onClick={() => {
                          setSelectedReservation(reservation)
                          setReservationDialogOpen(true)
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar>
                            <CalendarToday />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {reservation.purpose || 'Reserva sem título'}
                              <Chip
                                icon={getReservationStatusIcon(reservation.status)}
                                label={getReservationStatusText(reservation.status)}
                                color={getReservationStatusColor(reservation.status)}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {format(parseISO(reservation.start_time), 'HH:mm', { locale: ptBR })} - {format(parseISO(reservation.end_time), 'HH:mm', { locale: ptBR })}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {reservation.user?.name}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {canCheckIn(reservation) && (
                              <Tooltip title="Check-in">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigate(`/check-in/${space.id}`)
                                  }}
                                >
                                  <LocationOn />
                                </IconButton>
                              </Tooltip>
                            )}
                            <IconButton
                              edge="end"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedReservation(reservation)
                                setReservationDialogOpen(true)
                              }}
                            >
                              <Visibility />
                            </IconButton>
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < reservations.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Space Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Espaço</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Nome do Espaço"
              defaultValue={space.name}
              margin="normal"
              {...register('name', { required: 'Nome é obrigatório' })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Tipo de Espaço</InputLabel>
              <Select
                label="Tipo de Espaço"
                defaultValue={space.type}
                {...register('type', { required: 'Tipo é obrigatório' })}
                error={!!errors.type}
              >
                <MenuItem value="workstation">Estação de Trabalho</MenuItem>
                <MenuItem value="meeting_room">Sala de Reunião</MenuItem>
                <MenuItem value="conference_room">Sala de Conferência</MenuItem>
                <MenuItem value="phone_booth">Cabine Telefônica</MenuItem>
                <MenuItem value="lounge">Lounge</MenuItem>
                <MenuItem value="focus_room">Sala de Foco</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Capacidade"
              type="number"
              defaultValue={space.capacity}
              margin="normal"
              {...register('capacity', { required: 'Capacidade é obrigatória', min: 1 })}
              error={!!errors.capacity}
              helperText={errors.capacity?.message}
            />
            <TextField
              fullWidth
              label="Descrição"
              multiline
              rows={3}
              defaultValue={space.description}
              margin="normal"
              {...register('description')}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Disponível para Reserva</InputLabel>
              <Select
                label="Disponível para Reserva"
                defaultValue={space.is_bookable.toString()}
                {...register('is_bookable')}
              >
                <MenuItem value="true">Sim</MenuItem>
                <MenuItem value="false">Não</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                defaultValue={space.is_active.toString()}
                {...register('is_active')}
              >
                <MenuItem value="true">Ativo</MenuItem>
                <MenuItem value="false">Inativo</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit(onEditSubmit)}
            variant="contained"
            disabled={updateSpaceMutation.isLoading}
          >
            {updateSpaceMutation.isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reservation Details Dialog */}
      <Dialog open={reservationDialogOpen} onClose={() => setReservationDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedReservation && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  <CalendarToday />
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {selectedReservation.purpose || 'Reserva sem título'}
                  </Typography>
                  <Chip
                    icon={getReservationStatusIcon(selectedReservation.status)}
                    label={getReservationStatusText(selectedReservation.status)}
                    color={getReservationStatusColor(selectedReservation.status)}
                    size="small"
                  />
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Informações da Reserva</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar size="small">
                          <Today />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Data"
                        secondary={format(parseISO(selectedReservation.start_time), 'dd/MM/yyyy', { locale: ptBR })}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar size="small">
                          <AccessTime />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Horário"
                        secondary={`${format(parseISO(selectedReservation.start_time), 'HH:mm', { locale: ptBR })} - ${format(parseISO(selectedReservation.end_time), 'HH:mm', { locale: ptBR })}`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar size="small">
                          <Person />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Reservado por"
                        secondary={selectedReservation.user?.name}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar size="small">
                          <People />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Participantes"
                        secondary={`${selectedReservation.guests_count || 1} pessoa(s)`}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Espaço</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Nome"
                        secondary={space.name}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Tipo"
                        secondary={getSpaceTypeLabel(space.type)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Capacidade"
                        secondary={`${space.capacity} pessoas`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Localização"
                        secondary={`${space.floor?.building?.name} - ${space.floor?.name}`}
                      />
                    </ListItem>
                  </List>
                </Grid>
                {selectedReservation.notes && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Observações</Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2">
                        {selectedReservation.notes}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setReservationDialogOpen(false)}>Fechar</Button>
              {canCheckIn(selectedReservation) && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    navigate(`/check-in/${space.id}`)
                    setReservationDialogOpen(false)
                  }}
                >
                  Fazer Check-in
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}

export default SpaceDetailPage
