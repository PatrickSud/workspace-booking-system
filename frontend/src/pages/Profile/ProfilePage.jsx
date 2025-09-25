import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Avatar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material'
import {
  Person,
  Edit,
  Save,
  Cancel,
  Lock,
  Notifications,
  Business,
  Email,
  Phone,
  AccessTime,
  EventAvailable
} from '@mui/icons-material'
import { useMutation, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { useAuth } from '../../contexts/AuthContext'

function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth()
  const queryClient = useQueryClient()
  const [editMode, setEditMode] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
    phone: user?.phone || '',
    preferences: {
      notifications: {
        email: user?.preferences?.notifications?.email || true,
        push: user?.preferences?.notifications?.push || true
      },
      default_duration: user?.preferences?.default_duration || 60
    }
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Update profile mutation
  const updateProfileMutation = useMutation(updateProfile, {
    onSuccess: () => {
      setEditMode(false)
      toast.success('Perfil atualizado com sucesso')
      queryClient.invalidateQueries(['profile'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.error?.message || 'Erro ao atualizar perfil')
    }
  })

  // Change password mutation
  const changePasswordMutation = useMutation(
    ({ currentPassword, newPassword }) => changePassword(currentPassword, newPassword),
    {
      onSuccess: () => {
        setPasswordDialogOpen(false)
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        toast.success('Senha alterada com sucesso')
      },
      onError: (error) => {
        toast.error(error.response?.data?.error?.message || 'Erro ao alterar senha')
      }
    }
  )

  const handleSave = () => {
    updateProfileMutation.mutate(formData)
  }

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      department: user?.department || '',
      phone: user?.phone || '',
      preferences: {
        notifications: {
          email: user?.preferences?.notifications?.email || true,
          push: user?.preferences?.notifications?.push || true
        },
        default_duration: user?.preferences?.default_duration || 60
      }
    })
    setEditMode(false)
  }

  const handlePasswordChange = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    })
  }

  const getRoleLabel = (role) => {
    return role === 'admin' ? 'Administrador' : 'Usuário'
  }

  const getRoleColor = (role) => {
    return role === 'admin' ? 'error' : 'primary'
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Meu Perfil
      </Typography>

      <Grid container spacing={3}>
        {/* Informações Básicas */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">
                  Informações Pessoais
                </Typography>
                {!editMode ? (
                  <Button
                    startIcon={<Edit />}
                    onClick={() => setEditMode(true)}
                  >
                    Editar
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      startIcon={<Save />}
                      variant="contained"
                      onClick={handleSave}
                      disabled={updateProfileMutation.isLoading}
                    >
                      Salvar
                    </Button>
                    <Button
                      startIcon={<Cancel />}
                      onClick={handleCancel}
                    >
                      Cancelar
                    </Button>
                  </Box>
                )}
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nome Completo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={formData.email}
                    disabled={true} // Email não pode ser alterado
                    InputProps={{
                      startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Departamento"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <Business sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Telefone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!editMode}
                    InputProps={{
                      startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Preferências */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Preferências
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled={!editMode}>
                    <InputLabel>Duração Padrão da Reserva</InputLabel>
                    <Select
                      value={formData.preferences.default_duration}
                      label="Duração Padrão da Reserva"
                      onChange={(e) => setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          default_duration: e.target.value
                        }
                      })}
                    >
                      <MenuItem value={30}>30 minutos</MenuItem>
                      <MenuItem value={60}>1 hora</MenuItem>
                      <MenuItem value={120}>2 horas</MenuItem>
                      <MenuItem value={240}>4 horas</MenuItem>
                      <MenuItem value={480}>8 horas</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle1" gutterBottom>
                Notificações
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.preferences.notifications.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      preferences: {
                        ...formData.preferences,
                        notifications: {
                          ...formData.preferences.notifications,
                          email: e.target.checked
                        }
                      }
                    })}
                    disabled={!editMode}
                  />
                }
                label="Notificações por Email"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.preferences.notifications.push}
                    onChange={(e) => setFormData({
                      ...formData,
                      preferences: {
                        ...formData.preferences,
                        notifications: {
                          ...formData.preferences.notifications,
                          push: e.target.checked
                        }
                      }
                    })}
                    disabled={!editMode}
                  />
                }
                label="Notificações Push"
              />
            </CardContent>
          </Card>

          {/* Segurança */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Segurança
              </Typography>
              
              <Button
                startIcon={<Lock />}
                variant="outlined"
                onClick={() => setPasswordDialogOpen(true)}
              >
                Alterar Senha
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Avatar e Info Básica */}
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2rem'
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
              
              <Typography variant="h6" gutterBottom>
                {user?.name}
              </Typography>
              
              <Chip
                label={getRoleLabel(user?.role)}
                color={getRoleColor(user?.role)}
                size="small"
                sx={{ mb: 2 }}
              />

              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informações da Conta
              </Typography>

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <AccessTime />
                  </ListItemIcon>
                  <ListItemText
                    primary="Último Login"
                    secondary={
                      user?.last_login
                        ? format(new Date(user.last_login), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                        : 'Nunca'
                    }
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <EventAvailable />
                  </ListItemIcon>
                  <ListItemText
                    primary="Membro desde"
                    secondary={
                      user?.createdAt
                        ? format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: ptBR })
                        : 'N/A'
                    }
                  />
                </ListItem>

                {user?.building && (
                  <ListItem>
                    <ListItemIcon>
                      <Business />
                    </ListItemIcon>
                    <ListItemText
                      primary="Prédio Principal"
                      secondary={user.building.name}
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog de Alteração de Senha */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Alterar Senha</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Senha Atual"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Nova Senha"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                helperText="Mínimo de 6 caracteres"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Confirmar Nova Senha"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                error={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''}
                helperText={
                  passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''
                    ? 'As senhas não coincidem'
                    : ''
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handlePasswordChange}
            disabled={
              !passwordData.currentPassword ||
              !passwordData.newPassword ||
              passwordData.newPassword !== passwordData.confirmPassword ||
              changePasswordMutation.isLoading
            }
          >
            Alterar Senha
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ProfilePage
