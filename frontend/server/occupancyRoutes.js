const express = require('express');
const router = express.Router();
const { fetchOccupancyData } = require('./occupancyScraper');

// GET /api/occupancy - Get all dining halls occupancy
router.get('/', async (req, res) => {
  try {
    const occupancyData = await fetchOccupancyData();
    res.json(occupancyData);
  } catch (error) {
    console.error('Error in occupancy route:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch occupancy data',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 