const express = require('express');
const router = express.Router();
const floorController = require('../controllers/floorController');
const { requireAdmin } = require('../middleware/auth');

// Get all floors
router.get('/', floorController.getFloors);

// Get floors by building
router.get('/building/:buildingId', floorController.getFloorsByBuilding);

// Get floor by ID
router.get('/:id', floorController.getFloorById);

// Create floor (admin only)
router.post('/', requireAdmin, floorController.createFloor);

// Update floor (admin only)
router.put('/:id', requireAdmin, floorController.updateFloor);

// Delete floor (admin only)
router.delete('/:id', requireAdmin, floorController.deleteFloor);

// Upload floor plan (admin only)
router.post('/:id/floor-plan', requireAdmin, floorController.upload.single('floor_plan'), floorController.uploadFloorPlan);

module.exports = router;
