import React from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material'
import {
  ArrowBack,
  LocationOn,
  Phone,
  Email,
  Person,
  Layers,
  EventSeat
} from '@mui/icons-material'
import { useQuery } from 'react-query'
import { useParams, useNavigate } from 'react-router-dom'

import { buildingService } from '../../services/buildingService'
import LoadingScreen from '../../components/Common/LoadingScreen'

const BuildingDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: buildingData, isLoading } = useQuery(
    ['building', id],
    () => buildingService.getBuildingById(id),
    {
      enabled: !!id,
    }
  )

  const { data: statsData } = useQuery(
    ['buildingStats', id],
    () => buildingService.getBuildingStats(id),
    {
      enabled: !!id,
    }
  )

  if (isLoading) {
    return <LoadingScreen message="Carregando detalhes do prédio..." />
  }

  const building = buildingData?.data?.building
  const stats = statsData?.data?.stats

  if (!building) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">
          Prédio não encontrado
        </Typography>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/buildings')}
          sx={{ mt: 2 }}
        >
          Voltar para Prédios
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/buildings')}
          sx={{ mr: 2 }}
        >
          Voltar
        </Button>
        <Typography variant="h4" component="h1">
          {building.name}
        </Typography>
        <Box sx={{ ml: 2 }}>
          <Chip
            label={building.is_active ? 'Ativo' : 'Inativo'}
            color={building.is_active ? 'success' : 'default'}
          />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Building Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informações do Prédio
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body1">
                    {building.address}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
                  {building.city}, {building.state} - {building.zip_code}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 3 }}>
                  {building.country}
                </Typography>
              </Box>

              {building.description && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Descrição
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {building.description}
                  </Typography>
                </Box>
              )}

              {/* Contact Information */}
              {building.contact_info && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Informações de Contato
                  </Typography>
                  <List dense>
                    {building.contact_info.phone && (
                      <ListItem>
                        <ListItemIcon>
                          <Phone fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={building.contact_info.phone} />
                      </ListItem>
                    )}
                    {building.contact_info.email && (
                      <ListItem>
                        <ListItemIcon>
                          <Email fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={building.contact_info.email} />
                      </ListItem>
                    )}
                    {building.contact_info.manager && (
                      <ListItem>
                        <ListItemIcon>
                          <Person fontSize="small" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={building.contact_info.manager}
                          secondary="Gerente"
                        />
                      </ListItem>
                    )}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Statistics */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estatísticas
              </Typography>
              
              {stats ? (
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Layers />
                    </ListItemIcon>
                    <ListItemText
                      primary={stats.total_floors}
                      secondary="Andares"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <EventSeat />
                    </ListItemIcon>
                    <ListItemText
                      primary={stats.total_spaces}
                      secondary="Espaços Totais"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <EventSeat />
                    </ListItemIcon>
                    <ListItemText
                      primary={stats.bookable_spaces}
                      secondary="Espaços Reserváveis"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary={`${stats.occupancy_rate}%`}
                      secondary="Taxa de Ocupação Hoje"
                    />
                  </ListItem>
                </List>
              ) : (
                <Typography color="text.secondary">
                  Carregando estatísticas...
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Floors */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Andares
              </Typography>
              
              {building.floors && building.floors.length > 0 ? (
                <Grid container spacing={2}>
                  {building.floors.map((floor) => (
                    <Grid item xs={12} sm={6} md={4} key={floor.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            {floor.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {floor.spaces?.length || 0} espaços
                          </Typography>
                          <Button
                            size="small"
                            sx={{ mt: 1 }}
                            onClick={() => navigate(`/floors/${floor.id}`)}
                          >
                            Ver Detalhes
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography color="text.secondary">
                  Nenhum andar cadastrado
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Business Hours */}
        {building.settings?.business_hours && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Horário de Funcionamento
                </Typography>
                
                <Grid container spacing={2}>
                  {Object.entries(building.settings.business_hours).map(([day, hours]) => (
                    <Grid item xs={12} sm={6} md={4} key={day}>
                      <Box sx={{ p: 1, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                          {day === 'monday' ? 'Segunda' :
                           day === 'tuesday' ? 'Terça' :
                           day === 'wednesday' ? 'Quarta' :
                           day === 'thursday' ? 'Quinta' :
                           day === 'friday' ? 'Sexta' :
                           day === 'saturday' ? 'Sábado' : 'Domingo'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {hours.enabled ? `${hours.start} - ${hours.end}` : 'Fechado'}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

export default BuildingDetailPage
