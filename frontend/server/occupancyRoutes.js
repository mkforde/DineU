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

// GET /api/occupancy/:locationId - Get specific dining hall occupancy by ID
router.get('/:locationId', async (req, res) => {
  try {
    const locationId = parseInt(req.params.locationId);
    
    if (isNaN(locationId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid location ID format',
        timestamp: new Date().toISOString()
      });
    }

    console.log('Fetching data for location:', locationId);
    const occupancyData = await fetchOccupancyData(locationId);
    
    if (!occupancyData.success) {
      return res.status(404).json(occupancyData);
    }

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