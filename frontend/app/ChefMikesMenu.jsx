import React, { useRef, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keep only the basic state
const [occupancyData, setOccupancyData] = useState({ use: 0, capacity: 250 });

// Add the occupancy fetch useEffect:
useEffect(() => {
  async function fetchOccupancyWithCache() {
    const now = Date.now();
    const cache = occupancyCache.current;

    if (cache.data) {
      setOccupancyData(cache.data);
    }

    if (!cache.data || now - cache.lastFetched > 30000) {
      try {
        const response = await fetch('http://100.78.111.116:3000/api/occupancy/843');
        const occupancyData = await response.json();
        
        if (occupancyData.success && occupancyData.data) {
          const currentOccupancy = Math.round((occupancyData.data.percentageFull * 250) / 100);
          
          const newData = {
            use: currentOccupancy,
            capacity: 250
          };

          occupancyCache.current = {
            data: newData,
            lastFetched: now
          };
          await AsyncStorage.setItem('chefmikes_occupancy', JSON.stringify(newData));

          if (!cache.data || cache.data.use !== newData.use) {
            setOccupancyData(newData);
          }
        }
      } catch (error) {
        console.error('Error fetching occupancy:', error);
      }
    }
  }

  fetchOccupancyWithCache();
  const interval = setInterval(fetchOccupancyWithCache, 30000);
  return () => clearInterval(interval);
}, []);

export default ChefMikesMenu; 