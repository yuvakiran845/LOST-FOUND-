const express = require('express');
const router  = express.Router();

const { protect }   = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const {
  getStats,
  getAllItems,
  getAllUsers,
  getAllRequests,
  adminDeleteItem,
  adminUpdateItemStatus,
} = require('../controllers/adminController');

// All routes require authentication AND admin role
router.use(protect, adminOnly);

// GET  /api/admin/stats            — platform statistics
router.get('/stats', getStats);

// GET  /api/admin/items            — paginated items list
router.get('/items', getAllItems);

// DELETE /api/admin/items/:id      — remove any item
router.delete('/items/:id', adminDeleteItem);

// PATCH /api/admin/items/:id/status — update any item's status
router.patch('/items/:id/status', adminUpdateItemStatus);

// GET  /api/admin/users            — paginated users list
router.get('/users', getAllUsers);

// GET  /api/admin/requests         — paginated requests list
router.get('/requests', getAllRequests);

module.exports = router;
