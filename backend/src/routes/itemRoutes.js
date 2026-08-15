const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const {
  createItem,
  getItems,
  getMyItems,
  getItemById,
  updateItem,
  deleteItem,
} = require('../controllers/itemController');

const { getMatches } = require('../controllers/matchController');

// IMPORTANT: /my must be registered BEFORE /:id
// If /:id comes first, Express would treat "my" as a MongoDB ID (and fail)

// GET  /api/items/my      — get current user's items (protected)
router.get('/my', protect, getMyItems);

// GET  /api/items         — get all items (public, with optional ?type=&category= filters)
// POST /api/items         — create a new item (protected, with optional image)
router
  .route('/')
  .get(getItems)
  .post(protect, upload.single('image'), handleUploadError, createItem);

// GET /api/items/:id/matches — find potential matches (public)
// IMPORTANT: must be registered BEFORE /:id so Express doesn't treat 'matches' as an ID
router.get('/:id/matches', getMatches);

// GET    /api/items/:id   — get a single item (public)
// PUT    /api/items/:id   — update an item (protected, owner only)
// DELETE /api/items/:id   — delete an item (protected, owner only)
router
  .route('/:id')
  .get(getItemById)
  .put(protect, upload.single('image'), handleUploadError, updateItem)
  .delete(protect, deleteItem);

module.exports = router;
