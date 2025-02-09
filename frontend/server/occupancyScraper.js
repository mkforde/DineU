const DINING_HALL_IDS = {
  "JJ's": 839,
  "Ferris": 835,
  "John Jay": 840,
  // Add other dining hall IDs as we get them
};

async function fetchOccupancyData() {
  try {
    // First fetch the base data to get capacities
    const baseResponse = await fetch('https://dining.columbia.edu/cu_dining/rest/occuspace_locations');
    const baseData = await baseResponse.json();
    
    // Create a map of id to capacity
    const capacityMap = {};
    baseData.data.forEach(location => {
      capacityMap[location.id] = location.capacity;
    });

    // Fetch current occupancy for each dining hall
    const occupancyData = {};
    for (const [diningHall, id] of Object.entries(DINING_HALL_IDS)) {
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
    console.error('Error fetching base occupancy data:', error);
    // Even if base request fails, return data for all dining halls with error states
    const occupancyData = {};
    for (const [diningHall, id] of Object.entries(DINING_HALL_IDS)) {
      occupancyData[diningHall] = {
        percentageFull: 0,
        capacity: null,
        lastUpdated: new Date().toISOString(),
        isActive: false,
        status: "error",
        message: "Failed to fetch base occupancy data"
      };
    }
    
    return {
      success: false,
      data: occupancyData,
      error: error.message || 'Failed to fetch base occupancy data',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  fetchOccupancyData
}; 