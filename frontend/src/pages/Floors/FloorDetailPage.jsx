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
  Badge
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
  Layers
} from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { floorService } from '../../services/floorService'
import { spaceService } from '../../services/spaceService'
import { useAuth } from '../../contexts/AuthContext'
import LoadingScreen from '../../components/Common/LoadingScreen'

const FloorDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { isAdmin } = useAuth()
  
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addSpaceDialogOpen, setAddSpaceDialogOpen] = useState(false)
  const [selectedSpace, setSelectedSpace] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm()

  // Fetch floor details
  const { data: floorData, isLoading: floorLoading } = useQuery(
    ['floor', id],
    () => floorService.getFloorById(id),
    {
      enabled: !!id,
      onError: (error) => {
        toast.error('Erro ao carregar detalhes do andar')
        console.error('Floor fetch error:', error)
      }
    }
  )

  // Fetch spaces in this floor
  const { data: spacesData, isLoading: spacesLoading } = useQuery(
    ['spaces', 'floor', id],
    () => spaceService.getSpaces({ floor_id: id }),
    {
      enabled: !!id,
      onError: (error) => {
        toast.error('Erro ao carregar espaços do andar')
        console.error('Spaces fetch error:', error)
      }
    }
  )

  // Update floor mutation
  const updateFloorMutation = useMutation(
    (data) => floorService.updateFloor(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['floor', id])
        toast.success('Andar atualizado com sucesso!')
        setEditDialogOpen(false)
        reset()
      },
      onError: (error) => {
        toast.error(error.response?.data?.error?.message || 'Erro ao atualizar andar')
      }
    }
  )

  // Create space mutation
  const createSpaceMutation = useMutation(spaceService.createSpace, {
    onSuccess: () => {
      queryClient.invalidateQueries(['spaces', 'floor', id])
      toast.success('Espaço criado com sucesso!')
      setAddSpaceDialogOpen(false)
      reset()
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Erro ao criar espaço')
    }
  })

  const floor = floorData?.data?.floor
  const spaces = spacesData?.data?.spaces || []

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

  const onEditSubmit = (data) => {
    updateFloorMutation.mutate(data)
  }

  const onAddSpaceSubmit = (data) => {
    createSpaceMutation.mutate({
      ...data,
      floor_id: id,
      capacity: parseInt(data.capacity),
      position: { x: 0, y: 0, width: 100, height: 100, rotation: 0 }
    })
  }

  if (floorLoading) return <LoadingScreen />

  if (!floor) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Andar não encontrado
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
            {floor.name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {floor.building?.name} - {floor.floor_number}º Andar
          </Typography>
        </Box>
        {isAdmin && (
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => setEditDialogOpen(true)}
          >
            Editar
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Floor Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informações do Andar
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <LocationOn />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Prédio"
                    secondary={floor.building?.name}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <Layers />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Número do Andar"
                    secondary={`${floor.floor_number}º Andar`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <EventSeat />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Total de Espaços"
                    secondary={`${spaces.length} espaços`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar>
                      <CheckCircle />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Espaços Ativos"
                    secondary={`${spaces.filter(s => s.is_active).length} ativos`}
                  />
                </ListItem>
              </List>
              
              {floor.description && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    {floor.description}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Spaces List */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Espaços do Andar ({spaces.length})
                </Typography>
                {isAdmin && (
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setAddSpaceDialogOpen(true)}
                  >
                    Adicionar Espaço
                  </Button>
                )}
              </Box>

              {spacesLoading ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography>Carregando espaços...</Typography>
                </Box>
              ) : spaces.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <EventSeat sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Nenhum espaço encontrado
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Este andar ainda não possui espaços cadastrados.
                  </Typography>
                </Box>
              ) : (
                <List>
                  {spaces.map((space, index) => (
                    <React.Fragment key={space.id}>
                      <ListItem
                        button
                        onClick={() => navigate(`/spaces/${space.id}`)}
                      >
                        <ListItemAvatar>
                          <Avatar>
                            {getSpaceTypeIcon(space.type)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {space.name}
                              <Chip
                                label={getSpaceStatusText(space)}
                                color={getSpaceStatusColor(space)}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {getSpaceTypeLabel(space.type)} • {space.capacity} pessoas
                              </Typography>
                              {space.description && (
                                <Typography variant="body2" color="text.secondary">
                                  {space.description}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/spaces/${space.id}`)
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < spaces.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Floor Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Andar</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Nome do Andar"
              defaultValue={floor.name}
              margin="normal"
              {...register('name', { required: 'Nome é obrigatório' })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              fullWidth
              label="Número do Andar"
              type="number"
              defaultValue={floor.floor_number}
              margin="normal"
              {...register('floor_number', { required: 'Número do andar é obrigatório' })}
              error={!!errors.floor_number}
              helperText={errors.floor_number?.message}
            />
            <TextField
              fullWidth
              label="Descrição"
              multiline
              rows={3}
              defaultValue={floor.description}
              margin="normal"
              {...register('description')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit(onEditSubmit)}
            variant="contained"
            disabled={updateFloorMutation.isLoading}
          >
            {updateFloorMutation.isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Space Dialog */}
      <Dialog open={addSpaceDialogOpen} onClose={() => setAddSpaceDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Adicionar Espaço</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Nome do Espaço"
              margin="normal"
              {...register('name', { required: 'Nome é obrigatório' })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Tipo de Espaço</InputLabel>
              <Select
                label="Tipo de Espaço"
                defaultValue=""
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
              margin="normal"
              {...register('description')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddSpaceDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit(onAddSpaceSubmit)}
            variant="contained"
            disabled={createSpaceMutation.isLoading}
          >
            {createSpaceMutation.isLoading ? 'Criando...' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default FloorDetailPage
