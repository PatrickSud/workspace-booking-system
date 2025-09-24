import React, { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
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
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Switch,
  FormControlLabel,
  CircularProgress
} from '@mui/material'
import {
  Search,
  FilterList,
  Add,
  Edit,
  Delete,
  Visibility,
  Person,
  AdminPanelSettings,
  Work,
  Email,
  Phone,
  Business,
  CheckCircle,
  Cancel,
  MoreVert,
  PersonAdd,
  Block,
  VpnKey
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { userService } from '../../services/userService'
import { buildingService } from '../../services/buildingService'
import { useAuth } from '../../contexts/AuthContext'
import LoadingScreen from '../../components/Common/LoadingScreen'

const UsersPage = () => {
  const { user: currentUser, isAdmin } = useAuth()
  const queryClient = useQueryClient()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterBuilding, setFilterBuilding] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm()

  // Fetch users
  const { data: usersData, isLoading, error } = useQuery(
    ['users', page, rowsPerPage, searchTerm, filterRole, filterStatus, filterBuilding],
    () => userService.getUsers({
      page: page + 1,
      limit: rowsPerPage,
      search: searchTerm,
      role: filterRole !== 'all' ? filterRole : undefined,
      is_active: filterStatus !== 'all' ? filterStatus === 'active' : undefined,
      building_id: filterBuilding !== 'all' ? filterBuilding : undefined
    }),
    {
      keepPreviousData: true,
      onError: (error) => {
        toast.error('Erro ao carregar usuários')
        console.error('Users fetch error:', error)
      }
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

  // Create user mutation
  const createMutation = useMutation(userService.createUser, {
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('Usuário criado com sucesso!')
      setCreateDialogOpen(false)
      reset()
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Erro ao criar usuário')
    }
  })

  // Update user mutation
  const updateMutation = useMutation(
    ({ id, data }) => userService.updateUser(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users'])
        toast.success('Usuário atualizado com sucesso!')
        setEditDialogOpen(false)
        reset()
      },
      onError: (error) => {
        toast.error(error.response?.data?.error?.message || 'Erro ao atualizar usuário')
      }
    }
  )

  // Delete user mutation
  const deleteMutation = useMutation(userService.deleteUser, {
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('Usuário removido com sucesso!')
      setDeleteDialogOpen(false)
      setSelectedUser(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Erro ao remover usuário')
    }
  })

  // Toggle user status mutation
  const toggleStatusMutation = useMutation(
    ({ id, is_active }) => userService.updateUser(id, { is_active }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users'])
        toast.success('Status do usuário atualizado!')
      },
      onError: (error) => {
        toast.error(error.response?.data?.error?.message || 'Erro ao atualizar status')
      }
    }
  )

  const users = usersData?.data?.users || []
  const totalUsers = usersData?.data?.pagination?.total || 0
  const buildings = buildingsData || []

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <AdminPanelSettings color="error" />
      case 'manager': return <Work color="warning" />
      case 'user': return <Person color="primary" />
      default: return <Person />
    }
  }

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Administrador',
      manager: 'Gerente',
      user: 'Usuário'
    }
    return labels[role] || role
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error'
      case 'manager': return 'warning'
      case 'user': return 'primary'
      default: return 'default'
    }
  }

  const handleCreateUser = (data) => {
    createMutation.mutate({
      ...data,
      building_id: data.building_id || null
    })
  }

  const handleEditUser = (data) => {
    updateMutation.mutate({
      id: selectedUser.id,
      data: {
        ...data,
        building_id: data.building_id || null
      }
    })
  }

  const handleDeleteUser = () => {
    if (selectedUser) {
      deleteMutation.mutate(selectedUser.id)
    }
  }

  const handleToggleStatus = (user) => {
    toggleStatusMutation.mutate({
      id: user.id,
      is_active: !user.is_active
    })
  }

  const openEditDialog = (user) => {
    setSelectedUser(user)
    setValue('name', user.name)
    setValue('email', user.email)
    setValue('role', user.role)
    setValue('department', user.department || '')
    setValue('phone', user.phone || '')
    setValue('building_id', user.building_id || '')
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (user) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active)
    const matchesBuilding = filterBuilding === 'all' || user.building_id === filterBuilding

    return matchesSearch && matchesRole && matchesStatus && matchesBuilding
  })

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6" gutterBottom>
            Acesso Negado
          </Typography>
          <Typography variant="body2">
            Você não tem permissão para acessar o gerenciamento de usuários.
          </Typography>
        </Alert>
      </Box>
    )
  }

  if (isLoading) return <LoadingScreen />

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Erro ao carregar usuários: {error.response?.data?.error?.message || error.message}
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gerenciamento de Usuários
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Novo Usuário
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Buscar usuários..."
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
                <InputLabel>Função</InputLabel>
                <Select
                  value={filterRole}
                  label="Função"
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <MenuItem value="all">Todas as Funções</MenuItem>
                  <MenuItem value="admin">Administrador</MenuItem>
                  <MenuItem value="manager">Gerente</MenuItem>
                  <MenuItem value="user">Usuário</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">Todos os Status</MenuItem>
                  <MenuItem value="active">Ativo</MenuItem>
                  <MenuItem value="inactive">Inativo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
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
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('')
                  setFilterRole('all')
                  setFilterStatus('all')
                  setFilterBuilding('all')
                }}
              >
                Limpar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Usuário</TableCell>
                <TableCell>Função</TableCell>
                <TableCell>Departamento</TableCell>
                <TableCell>Prédio</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Último Login</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {user.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2">
                          {user.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                        {user.phone && (
                          <Typography variant="caption" color="text.secondary">
                            {user.phone}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getRoleIcon(user.role)}
                      label={getRoleLabel(user.role)}
                      color={getRoleColor(user.role)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.department || '-'}
                  </TableCell>
                  <TableCell>
                    {user.building?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={user.is_active}
                          onChange={() => handleToggleStatus(user)}
                          color="primary"
                        />
                      }
                      label={user.is_active ? 'Ativo' : 'Inativo'}
                    />
                  </TableCell>
                  <TableCell>
                    {user.last_login ?
                      format(parseISO(user.last_login), 'dd/MM/yyyy HH:mm', { locale: ptBR }) :
                      'Nunca'
                    }
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Visualizar">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedUser(user)
                          setDialogOpen(true)
                        }}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    {user.id !== currentUser.id && (
                      <Tooltip title="Excluir">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => openDeleteDialog(user)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalUsers}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10))
            setPage(0)
          }}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Card>

      {/* View User Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedUser && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  {selectedUser.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedUser.name}</Typography>
                  <Chip
                    icon={getRoleIcon(selectedUser.role)}
                    label={getRoleLabel(selectedUser.role)}
                    color={getRoleColor(selectedUser.role)}
                    size="small"
                  />
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Informações Pessoais</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar size="small">
                          <Email />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Email"
                        secondary={selectedUser.email}
                      />
                    </ListItem>
                    {selectedUser.phone && (
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar size="small">
                            <Phone />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary="Telefone"
                          secondary={selectedUser.phone}
                        />
                      </ListItem>
                    )}
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar size="small">
                          <Work />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Departamento"
                        secondary={selectedUser.department || 'Não informado'}
                      />
                    </ListItem>
                    {selectedUser.building && (
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar size="small">
                            <Business />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary="Prédio"
                          secondary={selectedUser.building.name}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>Informações do Sistema</Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Status"
                        secondary={
                          <Chip
                            icon={selectedUser.is_active ? <CheckCircle /> : <Cancel />}
                            label={selectedUser.is_active ? 'Ativo' : 'Inativo'}
                            color={selectedUser.is_active ? 'success' : 'error'}
                            size="small"
                          />
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Último Login"
                        secondary={selectedUser.last_login ?
                          format(parseISO(selectedUser.last_login), 'dd/MM/yyyy HH:mm', { locale: ptBR }) :
                          'Nunca fez login'
                        }
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Criado em"
                        secondary={format(parseISO(selectedUser.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Atualizado em"
                        secondary={format(parseISO(selectedUser.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      />
                    </ListItem>
                  </List>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Fechar</Button>
              <Button
                variant="contained"
                onClick={() => {
                  setDialogOpen(false)
                  openEditDialog(selectedUser)
                }}
              >
                Editar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Criar Novo Usuário</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Nome Completo"
              margin="normal"
              {...register('name', { required: 'Nome é obrigatório' })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              margin="normal"
              {...register('email', {
                required: 'Email é obrigatório',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email inválido'
                }
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              fullWidth
              label="Senha"
              type="password"
              margin="normal"
              {...register('password', {
                required: 'Senha é obrigatória',
                minLength: {
                  value: 6,
                  message: 'Senha deve ter pelo menos 6 caracteres'
                }
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Função</InputLabel>
              <Select
                label="Função"
                defaultValue="user"
                {...register('role', { required: 'Função é obrigatória' })}
                error={!!errors.role}
              >
                <MenuItem value="user">Usuário</MenuItem>
                <MenuItem value="manager">Gerente</MenuItem>
                <MenuItem value="admin">Administrador</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Departamento"
              margin="normal"
              {...register('department')}
            />
            <TextField
              fullWidth
              label="Telefone"
              margin="normal"
              {...register('phone')}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Prédio</InputLabel>
              <Select
                label="Prédio"
                defaultValue=""
                {...register('building_id')}
              >
                <MenuItem value="">Nenhum</MenuItem>
                {buildings.map((building) => (
                  <MenuItem key={building.id} value={building.id}>
                    {building.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit(handleCreateUser)}
            variant="contained"
            disabled={createMutation.isLoading}
          >
            {createMutation.isLoading ? 'Criando...' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Usuário</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Nome Completo"
              margin="normal"
              {...register('name', { required: 'Nome é obrigatório' })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              margin="normal"
              {...register('email', {
                required: 'Email é obrigatório',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email inválido'
                }
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Função</InputLabel>
              <Select
                label="Função"
                {...register('role', { required: 'Função é obrigatória' })}
                error={!!errors.role}
              >
                <MenuItem value="user">Usuário</MenuItem>
                <MenuItem value="manager">Gerente</MenuItem>
                <MenuItem value="admin">Administrador</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Departamento"
              margin="normal"
              {...register('department')}
            />
            <TextField
              fullWidth
              label="Telefone"
              margin="normal"
              {...register('phone')}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Prédio</InputLabel>
              <Select
                label="Prédio"
                {...register('building_id')}
              >
                <MenuItem value="">Nenhum</MenuItem>
                {buildings.map((building) => (
                  <MenuItem key={building.id} value={building.id}>
                    {building.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleSubmit(handleEditUser)}
            variant="contained"
            disabled={updateMutation.isLoading}
          >
            {updateMutation.isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Delete sx={{ mr: 1, color: 'error.main' }} />
            Excluir Usuário
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Atenção:</strong> Esta ação não pode ser desfeita. O usuário será removido permanentemente do sistema.
                </Typography>
              </Alert>

              <Typography variant="h6" gutterBottom>
                {selectedUser.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedUser.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getRoleLabel(selectedUser.role)} • {selectedUser.department || 'Sem departamento'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false)
              setSelectedUser(null)
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteUser}
            disabled={deleteMutation.isLoading}
            startIcon={deleteMutation.isLoading ? <CircularProgress size={20} /> : <Delete />}
          >
            {deleteMutation.isLoading ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default UsersPage
