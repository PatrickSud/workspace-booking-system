const express = require('express');
const router = express.Router();
const spaceController = require('../controllers/spaceController');
const { requireAdmin } = require('../middleware/auth');

// Get all spaces
router.get('/', spaceController.getSpaces);

// Get spaces by floor
router.get('/floor/:floorId', spaceController.getSpacesByFloor);

// Get space by ID
router.get('/:id', spaceController.getSpaceById);

// Get space availability
router.get('/:id/availability', spaceController.getSpaceAvailability);

// Create space (admin only)
router.post('/', requireAdmin, spaceController.createSpace);

// Update space (admin only)
router.put('/:id', requireAdmin, spaceController.updateSpace);

// Delete space (admin only)
router.delete('/:id', requireAdmin, spaceController.deleteSpace);

// Regenerate QR code (admin only)
router.post('/:id/qr-code', requireAdmin, spaceController.regenerateQRCode);

module.exports = router;
