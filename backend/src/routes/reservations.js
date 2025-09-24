const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { requireSelfOrAdmin } = require('../middleware/auth');

// Get all reservations (admin or filtered by user)
router.get('/', reservationController.getReservations);

// Get user's reservations
router.get('/my-reservations', reservationController.getUserReservations);

// Get reservation by ID
router.get('/:id', reservationController.getReservationById);

// Create new reservation
router.post('/', reservationController.createReservation);

// Update reservation
router.put('/:id', reservationController.updateReservation);

// Cancel reservation
router.put('/:id/cancel', reservationController.cancelReservation);

// Check-in to reservation
router.post('/:id/check-in', reservationController.checkInReservation);

module.exports = router;
