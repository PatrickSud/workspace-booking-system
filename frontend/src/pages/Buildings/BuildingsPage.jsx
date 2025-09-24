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
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material'
import {
  Search,
  Add,
  LocationOn,
  Business,
  Edit,
  Delete,
  Visibility
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { buildingService } from '../../services/buildingService'
import { useAuth } from '../../contexts/AuthContext'
import LoadingScreen from '../../components/Common/LoadingScreen'

const BuildingsPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm()

  // Fetch buildings
  const { data: buildingsData, isLoading } = useQuery(
    ['buildings', searchTerm],
    () => buildingService.getBuildings({ search: searchTerm }),
    {
      keepPreviousData: true,
    }
  )

  // Create building mutation
  const createMutation = useMutation(buildingService.createBuilding, {
    onSuccess: () => {
      queryClient.invalidateQueries('buildings')
      setCreateDialogOpen(false)
      reset()
      toast.success('Prédio criado com sucesso!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Erro ao criar prédio')
    }
  })

  // Update building mutation
  const updateMutation = useMutation(
    ({ id, data }) => buildingService.updateBuilding(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('buildings')
        setEditDialogOpen(false)
        setSelectedBuilding(null)
        reset()
        toast.success('Prédio atualizado com sucesso!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.error?.message || 'Erro ao atualizar prédio')
      }
    }
  )

  // Delete building mutation
  const deleteMutation = useMutation(buildingService.deleteBuilding, {
    onSuccess: () => {
      queryClient.invalidateQueries('buildings')
      setDeleteDialogOpen(false)
      setSelectedBuilding(null)
      toast.success('Prédio excluído com sucesso!')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Erro ao excluir prédio')
    }
  })

  const handleCreateSubmit = (data) => {
    createMutation.mutate(data)
  }

  const handleEditSubmit = (data) => {
    if (selectedBuilding) {
      updateMutation.mutate({ id: selectedBuilding.id, data })
    }
  }

  const handleEditClick = (building) => {
    setSelectedBuilding(building)
    reset({
      name: building.name,
      address: building.address,
      city: building.city,
      state: building.state,
      zip_code: building.zip_code,
      country: building.country,
      description: building.description
    })
    setEditDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (selectedBuilding) {
      deleteMutation.mutate(selectedBuilding.id)
    }
  }

  if (isLoading) {
    return <LoadingScreen message="Carregando prédios..." />
  }

  const buildings = buildingsData?.data?.buildings || []

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Prédios
        </Typography>
        {isAdmin() && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Novo Prédio
          </Button>
        )}
      </Box>

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Pesquisar prédios..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
      </Box>

      {/* Buildings Grid */}
      {buildings.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhum prédio encontrado
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm ? 'Tente ajustar sua pesquisa' : 'Comece criando um novo prédio'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {buildings.map((building) => (
            <Grid item xs={12} sm={6} md={4} key={building.id}>
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
                    <Business sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" component="h2">
                      {building.name}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationOn sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {building.city}, {building.state}
                    </Typography>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {building.address}
                  </Typography>

                  {building.description && (
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {building.description}
                    </Typography>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip
                      label={building.is_active ? 'Ativo' : 'Inativo'}
                      color={building.is_active ? 'success' : 'default'}
                      size="small"
                    />
                    <Chip
                      label={`${building.floors?.length || 0} andares`}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </CardContent>

                <CardActions>
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => navigate(`/buildings/${building.id}`)}
                  >
                    Ver Detalhes
                  </Button>
                  {isAdmin() && (
                    <>
                      <Button
                        size="small"
                        startIcon={<Edit />}
                        onClick={() => handleEditClick(building)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => {
                          setSelectedBuilding(building)
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

      {/* Create Building Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Criar Novo Prédio</DialogTitle>
        <form onSubmit={handleSubmit(handleCreateSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nome do Prédio"
                  {...register('name', { required: 'Nome é obrigatório' })}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Endereço"
                  multiline
                  rows={2}
                  {...register('address', { required: 'Endereço é obrigatório' })}
                  error={!!errors.address}
                  helperText={errors.address?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cidade"
                  {...register('city', { required: 'Cidade é obrigatória' })}
                  error={!!errors.city}
                  helperText={errors.city?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Estado"
                  {...register('state', { required: 'Estado é obrigatório' })}
                  error={!!errors.state}
                  helperText={errors.state?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="CEP"
                  {...register('zip_code')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="País"
                  defaultValue="Brasil"
                  {...register('country')}
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

      {/* Edit Building Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar Prédio</DialogTitle>
        <form onSubmit={handleSubmit(handleEditSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nome do Prédio"
                  {...register('name', { required: 'Nome é obrigatório' })}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Endereço"
                  multiline
                  rows={2}
                  {...register('address', { required: 'Endereço é obrigatório' })}
                  error={!!errors.address}
                  helperText={errors.address?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cidade"
                  {...register('city', { required: 'Cidade é obrigatória' })}
                  error={!!errors.city}
                  helperText={errors.city?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Estado"
                  {...register('state', { required: 'Estado é obrigatório' })}
                  error={!!errors.state}
                  helperText={errors.state?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="CEP"
                  {...register('zip_code')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="País"
                  {...register('country')}
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
            Tem certeza que deseja excluir o prédio "{selectedBuilding?.name}"?
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

export default BuildingsPage
