const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAdmin, requireSelfOrAdmin } = require('../middleware/auth');

// Get all users (admin only)
router.get('/', requireAdmin, userController.getAllUsers);

// Get user by ID (self or admin)
router.get('/:id', requireSelfOrAdmin, userController.getUserById);

// Get user statistics (self or admin)
router.get('/:id/stats', requireSelfOrAdmin, userController.getUserStats);

// Create user (admin only)
router.post('/', requireAdmin, userController.createUser);

// Update user (self or admin)
router.put('/:id', requireSelfOrAdmin, userController.updateUser);

// Delete user (admin only)
router.delete('/:id', requireAdmin, userController.deleteUser);

// Reset user password (admin only)
router.put('/:id/reset-password', requireAdmin, userController.resetUserPassword);

module.exports = router;
