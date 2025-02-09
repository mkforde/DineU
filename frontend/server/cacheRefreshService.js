const menuScraper = require('./menuScraper');
const getMenuData = menuScraper.getMenuData;
const NutritionService = require('./nutritionService');
const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');

// Initialize Supabase client
const supabase = createClient(
  'https://eilgfvfxoaptkbqirdmj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpbGdmdmZ4b2FwdGticWlyZG1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMzMzNzksImV4cCI6MjA1NDYwOTM3OX0.ctCqhZDGK8l1Xb5cR8uhaBBjI7bWydAUF5iFN1QoxSs'
);

const nutritionService = new NutritionService(supabase);

async function refreshCache() {
  console.log('Starting daily cache refresh at:', new Date().toISOString());
  
  try {
    // Get real menu data from scraper with forceFresh = true
    console.log('Fetching fresh menu data from scraper...');
    const menuData = await getMenuData(supabase, true);
    console.log('Menu data received:', JSON.stringify(menuData, null, 2));
    
    if (!menuData.success) {
      throw new Error('Failed to fetch menu data: ' + menuData.error);
    }

    // Clear existing cache tables
    console.log('Clearing existing cache tables...');
    await supabase.from('menu_cache').delete().gt('id', 0);
    await supabase.from('nutrition_cache').delete().gt('id', 0);
    
    // Process each dining hall and meal period
    console.log('Adding menu items...');
    for (const [mealPeriod, items] of Object.entries(menuData.data)) {
      for (const item of items) {
        // Format the data for Postgres
        const menuItem = {
          mealType: mealPeriod,
          diningHall: item.diningHall,
          hours: item.hours || mealPeriod,
          foodType: item.foodType || 'Main Line',
          foodName: item.foodName,
          dietaryPreferences: pgArray(item.dietaryPreferences || []),
          contains: pgArray(item.contains || []),
          nutritionalInfo: item.nutritionalInfo || {},
          last_updated: new Date().toISOString()
        };

        const { error: menuError } = await supabase.from('menu_cache').insert(menuItem);
        if (menuError) {
          console.error(`Error inserting menu item ${item.foodName}:`, menuError);
          continue;
        }

        // Get nutrition data from service
        try {
          const nutritionData = await nutritionService.getNutritionData(
            item.foodName,
            item.diningHall
          );

          if (nutritionData) {
            const { error: nutritionError } = await supabase.from('nutrition_cache').insert({
              meal_name: item.foodName,
              dining_hall: item.diningHall,
              nutrition_data: nutritionData,
              last_updated: new Date().toISOString(),
              next_refresh: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            });

            if (nutritionError) {
              console.error(`Error inserting nutrition for ${item.foodName}:`, nutritionError);
            }
          }
        } catch (nutritionError) {
          console.error(`Error getting nutrition data for ${item.foodName}:`, nutritionError);
        }
      }
    }

    console.log('Cache refresh completed successfully');
  } catch (error) {
    console.error('Error refreshing cache:', error);
    throw error;
  }
}

// Schedule to run at 4 AM every day
cron.schedule('0 4 * * *', refreshCache);

// Also export for manual running
module.exports = {
  refreshCache
};

function pgArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return '{}';
  return '{' + arr.map(item => `"${item}"`).join(',') + '}';
} 