import React from 'react'
import { Box, Card, CardContent, Typography, Button } from '@mui/material'
import { Computer } from '@mui/icons-material'

function SpacesPageSimple() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Espaços
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Página de Espaços Funcionando
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Esta é uma versão simplificada da página de espaços para teste.
          </Typography>
          <Button variant="contained" startIcon={<Computer />}>
            Teste Funcionando
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}

export default SpacesPageSimple
