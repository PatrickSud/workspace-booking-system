const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireAdmin } = require('../middleware/auth');

// All report routes require admin access
router.use(requireAdmin);

// Dashboard statistics
router.get('/dashboard', reportController.getDashboardStats);

// Occupancy report
router.get('/occupancy', reportController.getOccupancyReport);

// Usage report
router.get('/usage', reportController.getUsageReport);

// No-show report
router.get('/no-show', reportController.getNoShowReport);

module.exports = router;
