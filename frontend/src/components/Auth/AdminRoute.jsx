import React from 'react'
import { Navigate } from 'react-router-dom'
import { Alert, Box, Typography } from '@mui/material'
import { useAuth } from '../../contexts/AuthContext'

const AdminRoute = ({ children }) => {
  const { user, isAdmin } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6" gutterBottom>
            Acesso Negado
          </Typography>
          <Typography variant="body2">
            Você não tem permissão para acessar esta página. 
            Esta área é restrita apenas para administradores.
          </Typography>
        </Alert>
      </Box>
    )
  }

  return children
}

export default AdminRoute
