import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardActions,
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
  Checkbox,
  FormControlLabel,
  FormGroup,
  Stack
} from '@mui/material'
import {
  Search,
  FilterList,
  Add,
  Edit,
  Delete,
  Visibility,
  People,
  Computer,
  Tv,
  LocalCafe,
  MeetingRoom,
  Phone,
  Weekend,
  Psychology,
  QrCode
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { spaceService } from '../../services/spaceService'
import { floorService } from '../../services/floorService'
import { buildingService } from '../../services/buildingService'
import { useAuth } from '../../contexts/AuthContext'
import LoadingScreen from '../../components/Common/LoadingScreen'

function SpacesPage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterFloor, setFilterFloor] = useState('all')
  const [filterBuilding, setFilterBuilding] = useState('all')
  const [selectedSpace, setSelectedSpace] = useState(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm()

  // Fetch spaces
  const { data: spacesData, isLoading, error } = useQuery(
    ['spaces', searchTerm, filterType, filterFloor, filterBuilding],
    () => spaceService.getSpaces({ 
      search: searchTerm,
      type: filterType !== 'all' ? filterType : undefined,
      floor_id: filterFloor !== 'all' ? filterFloor : undefined,
      building_id: filterBuilding !== 'all' ? filterBuilding : undefined
    }),
    {
      keepPreviousData: true,
    }
  )

  // Fetch buildings for filter
  const { data: buildingsData } = useQuery(
    'buildings',
    () => buildingService.getBuildings(),
    {
      select: (data) => data?.data?.buildings || []
    }
  )

  // Fetch floors for filter (based on selected building)
  const { data: floorsData } = useQuery(
    ['floors', filterBuilding],
    () => filterBuilding !== 'all' ? floorService.getFloorsByBuilding(filterBuilding) : Promise.resolve({ data: { floors: [] } }),
    {
      enabled: filterBuilding !== 'all',
      select: (data) => data?.data?.floors || []
    }
  )

  // Create space mutation
  const createMutation = useMutation(spaceService.createSpace, {
    onSuccess: () => {
      queryClient.invalidateQueries('spaces')
      setCreateDialogOpen(false)
      reset()
      toast.success('Espaço criado com sucesso!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Erro ao criar espaço')
    }
  })

  // Update space mutation
  const updateMutation = useMutation(
    ({ id, data }) => spaceService.updateSpace(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('spaces')
        setEditDialogOpen(false)
        setSelectedSpace(null)
        reset()
        toast.success('Espaço atualizado com sucesso!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.error?.message || 'Erro ao atualizar espaço')
      }
    }
  )

  // Delete space mutation
  const deleteMutation = useMutation(spaceService.deleteSpace, {
    onSuccess: () => {
      queryClient.invalidateQueries('spaces')
      setDeleteDialogOpen(false)
      setSelectedSpace(null)
      toast.success('Espaço excluído com sucesso!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Erro ao excluir espaço')
    }
  })

  const spaces = spacesData?.data?.spaces || []
  const buildings = buildingsData || []
  const floors = floorsData || []

  // Handler functions
  const handleCreateSubmit = (data) => {
    const equipmentData = {}
    if (data.equipment_monitor) equipmentData.monitor = true
    if (data.equipment_projector) equipmentData.projector = true
    if (data.equipment_tv) equipmentData.tv = true
    if (data.equipment_whiteboard) equipmentData.whiteboard = true
    if (data.equipment_keyboard) equipmentData.keyboard = true
    if (data.equipment_mouse) equipmentData.mouse = true

    createMutation.mutate({
      ...data,
      equipment: equipmentData,
      capacity: parseInt(data.capacity)
    })
  }

  const handleEditSubmit = (data) => {
    if (selectedSpace) {
      const equipmentData = {}
      if (data.equipment_monitor) equipmentData.monitor = true
      if (data.equipment_projector) equipmentData.projector = true
      if (data.equipment_tv) equipmentData.tv = true
      if (data.equipment_whiteboard) equipmentData.whiteboard = true
      if (data.equipment_keyboard) equipmentData.keyboard = true
      if (data.equipment_mouse) equipmentData.mouse = true

      updateMutation.mutate({ 
        id: selectedSpace.id, 
        data: {
          ...data,
          equipment: equipmentData,
          capacity: parseInt(data.capacity)
        }
      })
    }
  }

  const handleEditClick = (space) => {
    setSelectedSpace(space)
    reset({
      name: space.name,
      type: space.type,
      capacity: space.capacity,
      description: space.description,
      floor_id: space.floor_id,
      is_active: space.is_active,
      is_bookable: space.is_bookable,
      equipment_monitor: space.equipment?.monitor || false,
      equipment_projector: space.equipment?.projector || false,
      equipment_tv: space.equipment?.tv || false,
      equipment_whiteboard: space.equipment?.whiteboard || false,
      equipment_keyboard: space.equipment?.keyboard || false,
      equipment_mouse: space.equipment?.mouse || false
    })
    setEditDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (selectedSpace) {
      deleteMutation.mutate(selectedSpace.id)
    }
  }

  const handleDetailsClick = (space) => {
    setSelectedSpace(space)
    setDetailsDialogOpen(true)
  }

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

  const getStatusColor = (isActive, isBookable) => {
    if (!isActive) return 'error'
    if (!isBookable) return 'warning'
    return 'success'
  }

  const getStatusLabel = (isActive, isBookable) => {
    if (!isActive) return 'Inativo'
    if (!isBookable) return 'Não Reservável'
    return 'Disponível'
  }

  if (isLoading) {
    return <LoadingScreen message="Carregando espaços..." />
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Erro ao carregar espaços: {error.response?.data?.error?.message || error.message}
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Espaços
        </Typography>
        {isAdmin() && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Novo Espaço
          </Button>
        )}
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Buscar espaços..."
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
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={filterType}
                  label="Tipo"
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="workstation">Estação</MenuItem>
                  <MenuItem value="meeting_room">Reunião</MenuItem>
                  <MenuItem value="conference_room">Conferência</MenuItem>
                  <MenuItem value="phone_booth">Cabine</MenuItem>
                  <MenuItem value="lounge">Lounge</MenuItem>
                  <MenuItem value="focus_room">Foco</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2.5}>
              <FormControl fullWidth>
                <InputLabel>Prédio</InputLabel>
                <Select
                  value={filterBuilding}
                  label="Prédio"
                  onChange={(e) => {
                    setFilterBuilding(e.target.value)
                    setFilterFloor('all') // Reset floor filter when building changes
                  }}
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
            <Grid item xs={12} md={2.5}>
              <FormControl fullWidth>
                <InputLabel>Andar</InputLabel>
                <Select
                  value={filterFloor}
                  label="Andar"
                  onChange={(e) => setFilterFloor(e.target.value)}
                  disabled={filterBuilding === 'all'}
                >
                  <MenuItem value="all">Todos os Andares</MenuItem>
                  {floors.map((floor) => (
                    <MenuItem key={floor.id} value={floor.id}>
                      {floor.name}
                    </MenuItem>
                  ))}
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
                  setFilterType('all')
                  setFilterBuilding('all')
                  setFilterFloor('all')
                }}
              >
                Limpar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lista de Espaços */}
      {spaces.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Computer sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhum espaço encontrado
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || filterType !== 'all' || filterBuilding !== 'all' || filterFloor !== 'all' 
              ? 'Tente ajustar os filtros de busca' 
              : 'Comece criando um novo espaço'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {spaces.map((space) => (
            <Grid item xs={12} md={6} lg={4} key={space.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {getSpaceTypeIcon(space.type)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="div">
                        {space.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getSpaceTypeLabel(space.type)}
                      </Typography>
                    </Box>
                    <Chip
                      label={getStatusLabel(space.is_active, space.is_bookable)}
                      color={getStatusColor(space.is_active, space.is_bookable)}
                      size="small"
                    />
                  </Box>

                  {space.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {space.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <People sx={{ mr: 1, fontSize: 16 }} />
                    <Typography variant="body2">
                      Capacidade: {space.capacity} pessoas
                    </Typography>
                  </Box>

                  {space.floor && (
                    <Typography variant="body2" color="text.secondary">
                      {space.floor.building?.name} - {space.floor.name}
                    </Typography>
                  )}

                  {/* Equipamentos */}
                  {space.equipment && Object.keys(space.equipment).some(key => space.equipment[key]) && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Equipamentos:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {space.equipment.monitor && <Chip label="Monitor" size="small" />}
                        {space.equipment.projector && <Chip label="Projetor" size="small" />}
                        {space.equipment.tv && <Chip label="TV" size="small" />}
                        {space.equipment.whiteboard && <Chip label="Quadro" size="small" />}
                      </Box>
                    </Box>
                  )}
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => handleDetailsClick(space)}
                  >
                    Detalhes
                  </Button>
                  <Button
                    size="small"
                    startIcon={<QrCode />}
                    onClick={() => navigate(`/spaces/${space.id}`)}
                  >
                    Ver QR
                  </Button>
                  {isAdmin() && (
                    <>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => handleEditClick(space)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => {
                          setSelectedSpace(space)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        Excluir
                      </Button>
                    </>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog de Detalhes */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedSpace && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Informações Básicas</Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Capacidade:</strong> {selectedSpace.capacity} pessoas
                  </Typography>
                  <Typography variant="body2" paragraph>
                    <strong>Status:</strong> {getStatusLabel(selectedSpace.is_active, selectedSpace.is_bookable)}
                  </Typography>
                  {selectedSpace.description && (
                    <Typography variant="body2" paragraph>
                      <strong>Descrição:</strong> {selectedSpace.description}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Localização</Typography>
                  {selectedSpace.floor && (
                    <>
                      <Typography variant="body2">
                        <strong>Prédio:</strong> {selectedSpace.floor.building?.name}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Andar:</strong> {selectedSpace.floor.name}
                      </Typography>
                    </>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDetailsDialogOpen(false)}>Fechar</Button>
              <Button 
                variant="contained" 
                onClick={() => {
                  setDetailsDialogOpen(false)
                  navigate(`/reservations/new/${selectedSpace.id}`)
                }}
              >
                Reservar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Create Space Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Criar Novo Espaço</DialogTitle>
        <form onSubmit={handleSubmit(handleCreateSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nome do Espaço"
                  {...register('name', { required: 'Nome é obrigatório' })}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.type}>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    label="Tipo"
                    {...register('type', { required: 'Tipo é obrigatório' })}
                  >
                    <MenuItem value="workstation">Estação de Trabalho</MenuItem>
                    <MenuItem value="meeting_room">Sala de Reunião</MenuItem>
                    <MenuItem value="conference_room">Sala de Conferência</MenuItem>
                    <MenuItem value="phone_booth">Cabine Telefônica</MenuItem>
                    <MenuItem value="lounge">Lounge</MenuItem>
                    <MenuItem value="focus_room">Sala de Foco</MenuItem>
                  </Select>
                  {errors.type && <Typography variant="caption" color="error">{errors.type.message}</Typography>}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Capacidade"
                  type="number"
                  {...register('capacity', { 
                    required: 'Capacidade é obrigatória',
                    min: { value: 1, message: 'Capacidade deve ser pelo menos 1' }
                  })}
                  error={!!errors.capacity}
                  helperText={errors.capacity?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.floor_id}>
                  <InputLabel>Andar</InputLabel>
                  <Select
                    label="Andar"
                    {...register('floor_id', { required: 'Andar é obrigatório' })}
                  >
                    {buildings.map((building) => 
                      building.floors?.map((floor) => (
                        <MenuItem key={floor.id} value={floor.id}>
                          {building.name} - {floor.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {errors.floor_id && <Typography variant="caption" color="error">{errors.floor_id.message}</Typography>}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrição"
                  multiline
                  rows={3}
                  {...register('description')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Checkbox {...register('is_active')} defaultChecked />}
                  label="Espaço Ativo"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Checkbox {...register('is_bookable')} defaultChecked />}
                  label="Pode ser Reservado"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Equipamentos
                </Typography>
                <FormGroup row>
                  <FormControlLabel
                    control={<Checkbox {...register('equipment_monitor')} />}
                    label="Monitor"
                  />
                  <FormControlLabel
                    control={<Checkbox {...register('equipment_projector')} />}
                    label="Projetor"
                  />
                  <FormControlLabel
                    control={<Checkbox {...register('equipment_tv')} />}
                    label="TV"
                  />
                  <FormControlLabel
                    control={<Checkbox {...register('equipment_whiteboard')} />}
                    label="Quadro Branco"
                  />
                  <FormControlLabel
                    control={<Checkbox {...register('equipment_keyboard')} />}
                    label="Teclado"
                  />
                  <FormControlLabel
                    control={<Checkbox {...register('equipment_mouse')} />}
                    label="Mouse"
                  />
                </FormGroup>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isLoading}
            >
              {createMutation.isLoading ? 'Criando...' : 'Criar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Space Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Editar Espaço</DialogTitle>
        <form onSubmit={handleSubmit(handleEditSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nome do Espaço"
                  {...register('name', { required: 'Nome é obrigatório' })}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.type}>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    label="Tipo"
                    {...register('type', { required: 'Tipo é obrigatório' })}
                  >
                    <MenuItem value="workstation">Estação de Trabalho</MenuItem>
                    <MenuItem value="meeting_room">Sala de Reunião</MenuItem>
                    <MenuItem value="conference_room">Sala de Conferência</MenuItem>
                    <MenuItem value="phone_booth">Cabine Telefônica</MenuItem>
                    <MenuItem value="lounge">Lounge</MenuItem>
                    <MenuItem value="focus_room">Sala de Foco</MenuItem>
                  </Select>
                  {errors.type && <Typography variant="caption" color="error">{errors.type.message}</Typography>}
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Capacidade"
                  type="number"
                  {...register('capacity', { 
                    required: 'Capacidade é obrigatória',
                    min: { value: 1, message: 'Capacidade deve ser pelo menos 1' }
                  })}
                  error={!!errors.capacity}
                  helperText={errors.capacity?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.floor_id}>
                  <InputLabel>Andar</InputLabel>
                  <Select
                    label="Andar"
                    {...register('floor_id', { required: 'Andar é obrigatório' })}
                  >
                    {buildings.map((building) => 
                      building.floors?.map((floor) => (
                        <MenuItem key={floor.id} value={floor.id}>
                          {building.name} - {floor.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {errors.floor_id && <Typography variant="caption" color="error">{errors.floor_id.message}</Typography>}
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrição"
                  multiline
                  rows={3}
                  {...register('description')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Checkbox {...register('is_active')} />}
                  label="Espaço Ativo"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Checkbox {...register('is_bookable')} />}
                  label="Pode ser Reservado"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Equipamentos
                </Typography>
                <FormGroup row>
                  <FormControlLabel
                    control={<Checkbox {...register('equipment_monitor')} />}
                    label="Monitor"
                  />
                  <FormControlLabel
                    control={<Checkbox {...register('equipment_projector')} />}
                    label="Projetor"
                  />
                  <FormControlLabel
                    control={<Checkbox {...register('equipment_tv')} />}
                    label="TV"
                  />
                  <FormControlLabel
                    control={<Checkbox {...register('equipment_whiteboard')} />}
                    label="Quadro Branco"
                  />
                  <FormControlLabel
                    control={<Checkbox {...register('equipment_keyboard')} />}
                    label="Teclado"
                  />
                  <FormControlLabel
                    control={<Checkbox {...register('equipment_mouse')} />}
                    label="Mouse"
                  />
                </FormGroup>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={updateMutation.isLoading}
            >
              {updateMutation.isLoading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Esta ação não pode ser desfeita!
          </Alert>
          <Typography>
            Tem certeza que deseja excluir o espaço "{selectedSpace?.name}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={deleteMutation.isLoading}
          >
            {deleteMutation.isLoading ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SpacesPage
