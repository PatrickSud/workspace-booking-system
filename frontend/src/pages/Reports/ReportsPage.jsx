import React from 'react'
import { Box, Typography, Card, CardContent } from '@mui/material'
import { Construction } from '@mui/icons-material'

const ReportsPage = () => {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Relatórios
      </Typography>
      
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 8 }}>
          <Construction sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Página em Desenvolvimento
          </Typography>
          <Typography variant="body2" color="text.secondary">
            A funcionalidade de relatórios está sendo desenvolvida.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}

export default ReportsPage
