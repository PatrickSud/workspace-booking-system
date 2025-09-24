import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Grid,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Stack
} from '@mui/material'
import {
  Search,
  Add,
  Layers,
  Business,
  Edit,
  Delete,
  Visibility,
  Upload,
  Map
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { floorService } from '../../services/floorService'
import { buildingService } from '../../services/buildingService'
import { useAuth } from '../../contexts/AuthContext'
import LoadingScreen from '../../components/Common/LoadingScreen'

const FloorsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBuilding, setSelectedBuilding] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedFloor, setSelectedFloor] = useState(null)
  
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm()

  // Fetch buildings for dropdown
  const { data: buildingsData } = useQuery(
    'buildings',
    () => buildingService.getBuildings(),
    {
      select: (data) => data?.data?.buildings || []
    }
  )

  // Fetch floors based on selected building
  const { data: floorsData, isLoading } = useQuery(
    ['floors', selectedBuilding, searchTerm],
    () => selectedBuilding ? floorService.getFloorsByBuilding(selectedBuilding, { search: searchTerm }) : Promise.resolve({ data: { floors: [] } }),
    {
      keepPreviousData: true,
      enabled: !!selectedBuilding
    }
  )

  // Create floor mutation
  const createMutation = useMutation(floorService.createFloor, {
    onSuccess: () => {
      queryClient.invalidateQueries(['floors', selectedBuilding])
      setCreateDialogOpen(false)
      reset()
      toast.success('Andar criado com sucesso!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Erro ao criar andar')
    }
  })

  // Update floor mutation
  const updateMutation = useMutation(
    ({ id, data }) => floorService.updateFloor(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['floors', selectedBuilding])
        setEditDialogOpen(false)
        setSelectedFloor(null)
        reset()
        toast.success('Andar atualizado com sucesso!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.error?.message || 'Erro ao atualizar andar')
      }
    }
  )

  // Delete floor mutation
  const deleteMutation = useMutation(floorService.deleteFloor, {
    onSuccess: () => {
      queryClient.invalidateQueries(['floors', selectedBuilding])
      setDeleteDialogOpen(false)
      setSelectedFloor(null)
      toast.success('Andar excluído com sucesso!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Erro ao excluir andar')
    }
  })

  const handleCreateSubmit = (data) => {
    createMutation.mutate({
      ...data,
      building_id: selectedBuilding
    })
  }

  const handleEditSubmit = (data) => {
    if (selectedFloor) {
      updateMutation.mutate({ 
        id: selectedFloor.id, 
        data: {
          ...data,
          building_id: selectedBuilding
        }
      })
    }
  }

  const handleEditClick = (floor) => {
    setSelectedFloor(floor)
    reset({
      name: floor.name,
      floor_number: floor.floor_number,
      description: floor.description
    })
    setEditDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (selectedFloor) {
      deleteMutation.mutate(selectedFloor.id)
    }
  }

  const buildings = buildingsData || []
  const floors = floorsData?.data?.floors || []

  if (isLoading && selectedBuilding) {
    return <LoadingScreen message="Carregando andares..." />
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Andares
        </Typography>
        {isAdmin() && selectedBuilding && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Novo Andar
          </Button>
        )}
      </Box>

      {/* Building Selection */}
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 300, mr: 2 }}>
          <InputLabel>Selecionar Prédio</InputLabel>
          <Select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            label="Selecionar Prédio"
          >
            <MenuItem value="">
              <em>Todos os prédios</em>
            </MenuItem>
            {buildings.map((building) => (
              <MenuItem key={building.id} value={building.id}>
                {building.name} - {building.city}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedBuilding && (
          <TextField
            placeholder="Pesquisar andares..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 300 }}
          />
        )}
      </Box>

      {/* Content */}
      {!selectedBuilding ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Selecione um prédio
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Escolha um prédio para visualizar e gerenciar seus andares
          </Typography>
        </Box>
      ) : floors.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Layers sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhum andar encontrado
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Tente ajustar sua pesquisa' : 'Comece criando um novo andar'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {floors.map((floor) => (
            <Grid item xs={12} sm={6} md={4} key={floor.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: 'primary.main',
                        mr: 2,
                        width: 40,
                        height: 40
                      }}
                    >
                      {floor.floor_number}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="h2">
                        {floor.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {floor.floor_number}º Andar
                      </Typography>
                    </Box>
                  </Box>

                  {floor.description && (
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {floor.description}
                    </Typography>
                  )}

                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Chip
                      label={floor.is_active ? 'Ativo' : 'Inativo'}
                      color={floor.is_active ? 'success' : 'default'}
                      size="small"
                    />
                    <Chip
                      label={`${floor.spaces?.length || 0} espaços`}
                      variant="outlined"
                      size="small"
                    />
                    {floor.floor_plan_url && (
                      <Chip
                        icon={<Map />}
                        label="Com planta"
                        color="info"
                        size="small"
                      />
                    )}
                  </Stack>
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => navigate(`/floors/${floor.id}`)}
                  >
                    Ver Detalhes
                  </Button>
                  {isAdmin() && (
                    <>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => handleEditClick(floor)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => {
                          setSelectedFloor(floor)
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

      {/* Create Floor Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Criar Novo Andar</DialogTitle>
        <form onSubmit={handleSubmit(handleCreateSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nome do Andar"
                  {...register('name', { required: 'Nome é obrigatório' })}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Número do Andar"
                  type="number"
                  {...register('floor_number', { 
                    required: 'Número do andar é obrigatório',
                    valueAsNumber: true
                  })}
                  error={!!errors.floor_number}
                  helperText={errors.floor_number?.message}
                />
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

      {/* Edit Floor Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar Andar</DialogTitle>
        <form onSubmit={handleSubmit(handleEditSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nome do Andar"
                  {...register('name', { required: 'Nome é obrigatório' })}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Número do Andar"
                  type="number"
                  {...register('floor_number', { 
                    required: 'Número do andar é obrigatório',
                    valueAsNumber: true
                  })}
                  error={!!errors.floor_number}
                  helperText={errors.floor_number?.message}
                />
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
            Tem certeza que deseja excluir o andar "{selectedFloor?.name}"?
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

export default FloorsPage
