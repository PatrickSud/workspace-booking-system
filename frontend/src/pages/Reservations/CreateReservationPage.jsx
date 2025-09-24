import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Divider,
  Stack,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  ArrowBack,
  ArrowForward,
  EventAvailable,
  Schedule,
  LocationOn,
  People,
  Computer,
  MeetingRoom,
  Tv,
  Phone,
  Weekend,
  Psychology,
  Check,
  AccessTime,
  CalendarToday
} from '@mui/icons-material'
// Temporarily commented out to fix loading issues
// import { DatePicker, TimePicker } from '@mui/x-date-pickers'
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ptBR } from 'date-fns/locale'
import { format, addMinutes, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { reservationService } from '../../services/reservationService'
import { spaceService } from '../../services/spaceService'
import { buildingService } from '../../services/buildingService'
import { useAuth } from '../../contexts/AuthContext'
import LoadingScreen from '../../components/Common/LoadingScreen'

const steps = ['Selecionar Espaço', 'Definir Horário', 'Confirmar Reserva']

const CreateReservationPage = () => {
  const { spaceId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [activeStep, setActiveStep] = useState(0)
  const [selectedSpace, setSelectedSpace] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [startTime, setStartTime] = useState(null)
  const [endTime, setEndTime] = useState(null)
  const [filterBuilding, setFilterBuilding] = useState('all')
  const [filterType, setFilterType] = useState('all')

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    defaultValues: {
      purpose: '',
      notes: '',
      guests_count: 1
    }
  })

  // Fetch buildings for filter
  const { data: buildingsData } = useQuery(
    'buildings',
    () => buildingService.getBuildings(),
    {
      select: (data) => data?.data?.buildings || []
    }
  )

  // Fetch spaces
  const { data: spacesData, isLoading: spacesLoading } = useQuery(
    ['spaces', filterBuilding, filterType],
    () => spaceService.getSpaces({ 
      building_id: filterBuilding !== 'all' ? filterBuilding : undefined,
      type: filterType !== 'all' ? filterType : undefined,
      is_bookable: true,
      is_active: true
    }),
    {
      keepPreviousData: true,
    }
  )

  // Fetch specific space if spaceId is provided
  const { data: preSelectedSpace } = useQuery(
    ['space', spaceId],
    () => spaceId ? spaceService.getSpaceById(spaceId) : null,
    {
      enabled: !!spaceId,
      onSuccess: (data) => {
        if (data?.data?.space) {
          setSelectedSpace(data.data.space)
          setActiveStep(1) // Skip to time selection
        }
      }
    }
  )

  // Create reservation mutation
  const createMutation = useMutation(reservationService.createReservation, {
    onSuccess: () => {
      queryClient.invalidateQueries('reservations')
      toast.success('Reserva criada com sucesso!')
      navigate('/reservations/my-reservations')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Erro ao criar reserva')
    }
  })

  const buildings = buildingsData || []
  const spaces = spacesData?.data?.spaces || []

  const getSpaceTypeIcon = (type) => {
    switch (type) {
      case 'workstation': return <Computer />
      case 'meeting_room': return <MeetingRoom />
      case 'conference_room': return <Tv />
      case 'phone_booth': return <Phone />
      case 'lounge': return <Weekend />
      case 'focus_room': return <Psychology />
      default: return <Computer />
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

  const handleNext = () => {
    if (activeStep === 0 && !selectedSpace) {
      toast.error('Selecione um espaço para continuar')
      return
    }
    if (activeStep === 1 && (!startTime || !endTime)) {
      toast.error('Defina o horário da reserva')
      return
    }
    if (activeStep === 1 && isBefore(endTime, startTime)) {
      toast.error('O horário de fim deve ser posterior ao horário de início')
      return
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleSpaceSelect = (space) => {
    setSelectedSpace(space)
  }

  const handleTimeChange = (field, value) => {
    if (field === 'start') {
      setStartTime(value)
      // Auto-set end time to 1 hour later
      if (value && !endTime) {
        setEndTime(addMinutes(value, 60))
      }
    } else {
      setEndTime(value)
    }
  }

  const onSubmit = (data) => {
    if (!selectedSpace || !startTime || !endTime) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    const reservationData = {
      space_id: selectedSpace.id,
      start_time: format(startTime, "yyyy-MM-dd'T'HH:mm:ss"),
      end_time: format(endTime, "yyyy-MM-dd'T'HH:mm:ss"),
      purpose: data.purpose,
      notes: data.notes,
      guests_count: parseInt(data.guests_count) || 1
    }

    createMutation.mutate(reservationData)
  }

  if (spacesLoading && !spaceId) {
    return <LoadingScreen message="Carregando espaços..." />
  }

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Selecione o Espaço
            </Typography>
            
            {/* Filtros */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Prédio</InputLabel>
                      <Select
                        value={filterBuilding}
                        label="Prédio"
                        onChange={(e) => setFilterBuilding(e.target.value)}
                      >
                        <MenuItem value="all">Todos os Prédios</MenuItem>
                        {buildings.map((building) => (
                          <MenuItem key={building.id} value={building.id}>
                            {building.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Tipo</InputLabel>
                      <Select
                        value={filterType}
                        label="Tipo"
                        onChange={(e) => setFilterType(e.target.value)}
                      >
                        <MenuItem value="all">Todos os Tipos</MenuItem>
                        <MenuItem value="workstation">Estação de Trabalho</MenuItem>
                        <MenuItem value="meeting_room">Sala de Reunião</MenuItem>
                        <MenuItem value="conference_room">Sala de Conferência</MenuItem>
                        <MenuItem value="phone_booth">Cabine Telefônica</MenuItem>
                        <MenuItem value="lounge">Lounge</MenuItem>
                        <MenuItem value="focus_room">Sala de Foco</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Lista de Espaços */}
            <List>
              {spaces.map((space) => (
                <React.Fragment key={space.id}>
                  <ListItemButton
                    selected={selectedSpace?.id === space.id}
                    onClick={() => handleSpaceSelect(space)}
                    sx={{
                      border: selectedSpace?.id === space.id ? 2 : 1,
                      borderColor: selectedSpace?.id === space.id ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      mb: 1
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {getSpaceTypeIcon(space.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={space.name}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {getSpaceTypeLabel(space.type)} • Capacidade: {space.capacity} pessoas
                          </Typography>
                          {space.floor && (
                            <Typography variant="body2" color="text.secondary">
                              {space.floor.building?.name} - {space.floor.name}
                            </Typography>
                          )}
                          {space.equipment && Object.keys(space.equipment).some(key => space.equipment[key]) && (
                            <Box sx={{ mt: 1 }}>
                              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                {space.equipment.monitor && <Chip label="Monitor" size="small" />}
                                {space.equipment.projector && <Chip label="Projetor" size="small" />}
                                {space.equipment.tv && <Chip label="TV" size="small" />}
                                {space.equipment.whiteboard && <Chip label="Quadro" size="small" />}
                              </Stack>
                            </Box>
                          )}
                        </Box>
                      }
                    />
                    {selectedSpace?.id === space.id && (
                      <Check color="primary" />
                    )}
                  </ListItemButton>
                </React.Fragment>
              ))}
            </List>

            {spaces.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  Nenhum espaço disponível
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tente ajustar os filtros
                </Typography>
              </Box>
            )}
          </Box>
        )

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Definir Horário
            </Typography>

            {selectedSpace && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {getSpaceTypeIcon(selectedSpace.type)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{selectedSpace.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getSpaceTypeLabel(selectedSpace.type)}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Data da Reserva"
                  type="date"
                  value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    min: format(new Date(), 'yyyy-MM-dd')
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Horário de Início"
                  type="time"
                  value={startTime ? format(startTime, 'HH:mm') : ''}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':')
                    const newTime = new Date(selectedDate)
                    newTime.setHours(parseInt(hours), parseInt(minutes))
                    handleTimeChange('start', newTime)
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Horário de Fim"
                  type="time"
                  value={endTime ? format(endTime, 'HH:mm') : ''}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':')
                    const newTime = new Date(selectedDate)
                    newTime.setHours(parseInt(hours), parseInt(minutes))
                    handleTimeChange('end', newTime)
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
            </Grid>

            {startTime && endTime && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Duração:</strong> {Math.round((endTime - startTime) / (1000 * 60))} minutos
                </Typography>
              </Alert>
            )}
          </Box>
        )

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Confirmar Reserva
            </Typography>

            {/* Resumo da Reserva */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Resumo da Reserva
                </Typography>
                
                {selectedSpace && (
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 32, height: 32 }}>
                        {getSpaceTypeIcon(selectedSpace.type)}
                      </Avatar>
                      <Typography variant="body1">
                        <strong>{selectedSpace.name}</strong>
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {getSpaceTypeLabel(selectedSpace.type)} • Capacidade: {selectedSpace.capacity} pessoas
                    </Typography>
                    {selectedSpace.floor && (
                      <Typography variant="body2" color="text.secondary">
                        📍 {selectedSpace.floor.building?.name} - {selectedSpace.floor.name}
                      </Typography>
                    )}
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                {startTime && endTime && (
                  <Box>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <CalendarToday sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                      <strong>Data:</strong> {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      <AccessTime sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                      <strong>Horário:</strong> {format(startTime, 'HH:mm')} às {format(endTime, 'HH:mm')}
                    </Typography>
                    <Typography variant="body1">
                      <Schedule sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                      <strong>Duração:</strong> {Math.round((endTime - startTime) / (1000 * 60))} minutos
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Detalhes Adicionais */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Detalhes Adicionais
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Finalidade da Reserva"
                      multiline
                      rows={2}
                      {...register('purpose', { required: 'Finalidade é obrigatória' })}
                      error={!!errors.purpose}
                      helperText={errors.purpose?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Número de Convidados"
                      type="number"
                      inputProps={{ min: 1, max: selectedSpace?.capacity || 50 }}
                      {...register('guests_count', { 
                        min: { value: 1, message: 'Mínimo 1 pessoa' },
                        max: { value: selectedSpace?.capacity || 50, message: `Máximo ${selectedSpace?.capacity || 50} pessoas` }
                      })}
                      error={!!errors.guests_count}
                      helperText={errors.guests_count?.message}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Observações (opcional)"
                      multiline
                      rows={3}
                      {...register('notes')}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        )

      default:
        return 'Passo desconhecido'
    }
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            Nova Reserva
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper sx={{ p: 3, mb: 3 }}>
          {renderStepContent(activeStep)}
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBack />}
          >
            Voltar
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleSubmit(onSubmit)}
              disabled={createMutation.isLoading}
              startIcon={<EventAvailable />}
            >
              {createMutation.isLoading ? 'Criando...' : 'Criar Reserva'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<ArrowForward />}
            >
              Próximo
            </Button>
          )}
        </Box>
      </Box>
  )
}

export default CreateReservationPage
