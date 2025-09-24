import React from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Chip,
  LinearProgress
} from '@mui/material'
import {
  Business,
  EventSeat,
  Event,
  TrendingUp,
  Add,
  Schedule
} from '@mui/icons-material'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '../../contexts/AuthContext'
import { reportService } from '../../services/reportService'
import { reservationService } from '../../services/reservationService'
import LoadingScreen from '../../components/Common/LoadingScreen'

const DashboardPage = () => {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  // Fetch dashboard stats for admins
  const { data: dashboardStats, isLoading: statsLoading } = useQuery(
    'dashboardStats',
    () => reportService.getDashboardStats(),
    {
      enabled: isAdmin(),
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  )

  // Fetch user's recent reservations
  const { data: userReservations, isLoading: reservationsLoading } = useQuery(
    'userReservations',
    () => reservationService.getUserReservations({ limit: 5 }),
    {
      refetchInterval: 60000, // Refresh every minute
    }
  )

  if (statsLoading || reservationsLoading) {
    return <LoadingScreen message="Carregando dashboard..." />
  }

  const stats = dashboardStats?.data || {}
  const reservations = userReservations?.data?.reservations || []

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'primary'
      case 'checked_in':
        return 'success'
      case 'completed':
        return 'default'
      case 'cancelled':
        return 'error'
      case 'no_show':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada'
      case 'checked_in':
        return 'Check-in'
      case 'completed':
        return 'Concluída'
      case 'cancelled':
        return 'Cancelada'
      case 'no_show':
        return 'Não compareceu'
      default:
        return status
    }
  }

  return (
    <Box>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Bem-vindo, {user?.name}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {new Date().toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Admin Stats Cards */}
        {isAdmin() && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <EventSeat />
                    </Avatar>
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Espaços Ativos
                      </Typography>
                      <Typography variant="h5">
                        {stats.total_spaces || 0}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                      <Event />
                    </Avatar>
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Reservas Hoje
                      </Typography>
                      <Typography variant="h5">
                        {stats.reservations?.today || 0}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                      <TrendingUp />
                    </Avatar>
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Taxa de Ocupação
                      </Typography>
                      <Typography variant="h5">
                        {stats.occupancy_rate || 0}%
                      </Typography>
                    </Box>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.occupancy_rate || 0} 
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                      <Business />
                    </Avatar>
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Usuários Ativos
                      </Typography>
                      <Typography variant="h5">
                        {stats.total_users || 0}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ações Rápidas
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/reservations/new')}
                  fullWidth
                >
                  Nova Reserva
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Event />}
                  onClick={() => navigate('/my-reservations')}
                  fullWidth
                >
                  Minhas Reservas
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<EventSeat />}
                  onClick={() => navigate('/spaces')}
                  fullWidth
                >
                  Explorar Espaços
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Reservations */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Reservas Recentes
              </Typography>
              {reservations.length === 0 ? (
                <Typography color="text.secondary">
                  Você ainda não possui reservas.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {reservations.map((reservation) => (
                    <Box
                      key={reservation.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2">
                          {reservation.space?.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(reservation.start_time).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(reservation.start_time).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </Box>
                      <Chip
                        label={getStatusText(reservation.status)}
                        color={getStatusColor(reservation.status)}
                        size="small"
                      />
                    </Box>
                  ))}
                  <Button
                    variant="text"
                    onClick={() => navigate('/my-reservations')}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Ver todas
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Admin Quick Stats */}
        {isAdmin() && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Resumo do Sistema
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {stats.reservations?.this_week || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Reservas esta semana
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {stats.check_ins?.rate_today || 0}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Taxa de check-in hoje
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {stats.no_shows?.rate_this_month || 0}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Taxa de no-show este mês
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

export default DashboardPage
