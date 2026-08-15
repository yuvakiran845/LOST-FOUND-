const express = require('express');
const router  = express.Router();

const { protect } = require('../middleware/auth');
const {
  createRequest,
  getMyRequests,
  getRequestsForMyItems,
  respondToRequest,
} = require('../controllers/requestController');

// All routes are protected — must be logged in

// GET  /api/requests/sent     — requests I sent
router.get('/sent', protect, getMyRequests);

// GET  /api/requests/received — requests on my items
router.get('/received', protect, getRequestsForMyItems);

// POST /api/requests          — submit a recovery request
router.post('/', protect, createRequest);

// PATCH /api/requests/:id     — accept or reject a request (item owner)
router.patch('/:id', protect, respondToRequest);

module.exports = router;
