const express = require('express');
const router = express.Router();

const authRoutes    = require('./authRoutes');
const itemRoutes    = require('./itemRoutes');
const requestRoutes = require('./requestRoutes');
const adminRoutes   = require('./adminRoutes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    message: 'CampusConnect API is running',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth',     authRoutes);
router.use('/items',    itemRoutes);
router.use('/requests', requestRoutes);
router.use('/admin',    adminRoutes);

module.exports = router;


