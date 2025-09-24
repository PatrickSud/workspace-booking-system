import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'

import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import AdminRoute from './components/Auth/AdminRoute'
import LoadingScreen from './components/Common/LoadingScreen'

// Pages
import LoginPage from './pages/Auth/LoginPage'
import LoginPageSimple from './pages/Auth/LoginPageSimple'
import RegisterPage from './pages/Auth/RegisterPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import BuildingsPage from './pages/Buildings/BuildingsPage'
import BuildingDetailPage from './pages/Buildings/BuildingDetailPage'
import FloorsPage from './pages/Floors/FloorsPage'
import FloorDetailPage from './pages/Floors/FloorDetailPage'
import SpacesPage from './pages/Spaces/SpacesPage'
import SpaceDetailPage from './pages/Spaces/SpaceDetailPage'
import ReservationsPage from './pages/Reservations/ReservationsPage'
import MyReservationsPage from './pages/Reservations/MyReservationsPage'
import CreateReservationPage from './pages/Reservations/CreateReservationPage'
import UsersPage from './pages/Users/UsersPage'
import ProfilePageSimple from './pages/Profile/ProfilePageSimple'
import ReportsPage from './pages/Reports/ReportsPage'
import CheckInPage from './pages/CheckIn/CheckInPage'
import NotFoundPage from './pages/Error/NotFoundPage'
import TestPage from './pages/TestPage'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <LoginPage />
          } 
        />
        <Route 
          path="/register" 
          element={
            user ? <Navigate to="/dashboard" replace /> : <RegisterPage />
          } 
        />
        
        {/* Check-in route (can be accessed without full authentication) */}
        <Route path="/check-in/:spaceId" element={<CheckInPage />} />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  {/* Dashboard */}
                  <Route path="/dashboard" element={<DashboardPage />} />
                  
                  {/* Buildings */}
                  <Route path="/buildings" element={<BuildingsPage />} />
                  <Route path="/buildings/:id" element={<BuildingDetailPage />} />
                  
                  {/* Floors */}
                  <Route path="/floors" element={<FloorsPage />} />
                  <Route path="/floors/:id" element={<FloorDetailPage />} />
                  
                  {/* Spaces */}
                  <Route path="/spaces" element={<SpacesPage />} />
                  <Route path="/spaces/:id" element={<SpaceDetailPage />} />
                  
                  {/* Reservations */}
                  <Route path="/reservations" element={<ReservationsPage />} />
                  <Route path="/my-reservations" element={<MyReservationsPage />} />
                  <Route path="/reservations/new" element={<CreateReservationPage />} />
                  <Route path="/reservations/new/:spaceId" element={<CreateReservationPage />} />
                  
                  {/* Users (Admin only) */}
                  <Route path="/users" element={<UsersPage />} />
                  
                  {/* Profile */}
                  <Route path="/profile" element={<ProfilePageSimple />} />
                  
                  {/* Reports (Admin only) */}
                  <Route path="/reports" element={<ReportsPage />} />
                  
                  {/* Admin Tests */}
                  <Route path="/admin/tests" element={
                    <AdminRoute>
                      <TestPage />
                    </AdminRoute>
                  } />
                  
                  {/* Default redirect */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  
                  {/* 404 */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Box>
  )
}

export default App
