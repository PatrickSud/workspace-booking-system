const express = require('express');
const router = express.Router();
const buildingController = require('../controllers/buildingController');
const { requireAdmin } = require('../middleware/auth');

// Get all buildings
router.get('/', buildingController.getAllBuildings);

// Get building by ID
router.get('/:id', buildingController.getBuildingById);

// Get building statistics
router.get('/:id/stats', buildingController.getBuildingStats);

// Create building (admin only)
router.post('/', requireAdmin, buildingController.createBuilding);

// Update building (admin only)
router.put('/:id', requireAdmin, buildingController.updateBuilding);

// Delete building (admin only)
router.delete('/:id', requireAdmin, buildingController.deleteBuilding);

module.exports = router;
