const DINING_HALL_IDS = {
  "JJ's": 839,
  "Ferris": 835,
  "John Jay": 840,
  // Add other dining hall IDs as we get them
};

async function fetchOccupancyData(locationId = null) {
  try {
    console.log(`Fetching occupancy data for location ID:`, locationId);
    
    // Convert locationId to number if it's a string
    if (locationId) {
      locationId = parseInt(locationId);
    }

    const baseResponse = await fetch('https://dining.columbia.edu/cu_dining/rest/occuspace_locations');
    const baseData = await baseResponse.json();
    console.log('Base data received:', baseData);

    if (locationId) {
      // Find the location in base data
      const locationData = baseData.data.find(loc => loc.id === locationId);
      if (!locationData) {
        console.log('Location not found in base data');
        return {
          success: false,
          error: `Location ID ${locationId} not found in base data`,
          timestamp: new Date().toISOString()
        };
      }

      // Get current occupancy
      const response = await fetch(`https://dining.columbia.edu/cu_dining/rest/occuspace_locations/${locationId}`);
      const data = await response.json();
      console.log('Location specific data:', data);

      // Handle closed/unavailable locations
      if (data.error === 'Realtime count data is unavailable') {
        return {
          success: true,
          data: {
            percentageFull: 0,
            capacity: locationData.capacity,
            lastUpdated: new Date().toISOString(),
            isActive: false,
            status: "closed",
            currentOccupancy: 0,
            maxCapacity: locationData.capacity
          },
          timestamp: new Date().toISOString()
        };
      }

      if (data.message === "OK" && data.data) {
        return {
          success: true,
          data: {
            percentageFull: data.data.percentage || 0,
            capacity: locationData.capacity,
            lastUpdated: data.data.timestamp,
            isActive: data.data.isActive,
            status: "available",
            currentOccupancy: Math.round((data.data.percentage / 100) * locationData.capacity),
            maxCapacity: locationData.capacity
          },
          timestamp: new Date().toISOString()
        };
      }
    }

    // Create a map of id to capacity
    const capacityMap = {};
    baseData.data.forEach(location => {
      capacityMap[location.id] = location.capacity;
    });

    // Fetch current occupancy for selected dining halls
    const occupancyData = {};
    for (const [diningHall, id] of Object.entries(DINING_HALL_IDS)) {
      if (!id) continue; // Skip if ID not found

      try {
        const response = await fetch(`https://dining.columbia.edu/cu_dining/rest/occuspace_locations/${id}`);
        const data = await response.json();
        
        if (data.message === "OK" && data.data) {
          occupancyData[diningHall] = {
            percentageFull: data.data.percentage || 0,
            capacity: capacityMap[id] || null,
            lastUpdated: data.data.timestamp,
            isActive: data.data.isActive,
            status: "available"
          };
        } else {
          occupancyData[diningHall] = {
            percentageFull: 0,
            capacity: capacityMap[id] || null,
            lastUpdated: new Date().toISOString(),
            isActive: false,
            status: "unavailable",
            message: "Location data not available"
          };
        }
      } catch (error) {
        console.error(`Error fetching occupancy for ${diningHall}:`, error);
        occupancyData[diningHall] = {
          percentageFull: 0,
          capacity: capacityMap[id] || null,
          lastUpdated: new Date().toISOString(),
          isActive: false,
          status: "error",
          message: "Failed to fetch occupancy data"
        };
      }
    }

    return {
      success: true,
      data: occupancyData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching occupancy data:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  fetchOccupancyData,
  DINING_HALL_IDS
}; 