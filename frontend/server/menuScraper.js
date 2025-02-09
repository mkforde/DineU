const puppeteer = require('puppeteer');
const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const NutritionService = require('./nutritionService');

// URL Constants
const MEAL_URLS = {
  breakfast: 'https://liondine.com/breakfast',
  lunch: 'https://liondine.com/lunch',
  dinner: 'https://liondine.com/dinner',
  latenight: 'https://liondine.com/latenight'
};

const DINING_HALL_URLS = {
  "JJ's": 'https://dining.columbia.edu/content/jjs-place-0',
  "Ferris": 'https://dining.columbia.edu/content/ferris-booth-commons-0',
  "Faculty House": 'https://dining.columbia.edu/content/faculty-house-0',
  "Chef Mike's": 'https://dining.columbia.edu/chef-mikes',
  "Johnny's": 'https://dining.columbia.edu/johnnys',
  "The Fac Shack": 'https://dining.columbia.edu/content/fac-shack-0',
  "John Jay": 'https://dining.columbia.edu/content/john-jay-dining-hall',
  "Grace Dodge": 'https://dining.columbia.edu/content/grace-dodge-dining-hall-0',
  "Chef Don's": 'https://dining.columbia.edu/content/chef-dons-pizza-pi'
};

// Barnard dining halls use a different website
const BARNARD_DINING_HALLS = {
  "Diana": 'https://dineoncampus.com/barnard/whats-on-the-menu',
  "Hewitt": 'https://dineoncampus.com/barnard/whats-on-the-menu'
};

// At the top of the file, add a cache for the scraped data
let scrapedMenuData = null;
let lastScrapeTime = null;
const SCRAPE_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Create a nutritionService instance per request with Supabase
router.use((req, res, next) => {
    req.nutritionService = new NutritionService(req.supabase);
    next();
});

// Helper function to check if a dining hall is closed
function isDiningHallClosed(menuItems, diningHall) {
  return menuItems.some(item => 
    item.diningHall === diningHall && 
    (item.foodName === "Closed" || item.foodName === "No items available")
  );
}

// Scraping Functions
async function scrapeNutritionalData(browser, diningHall) {
  // Skip Barnard dining halls as they use a different website
  if (Object.keys(BARNARD_DINING_HALLS).includes(diningHall)) {
    console.log(`Skipping nutritional data for ${diningHall} (Barnard dining hall)`);
    return null;
  }

  if (!DINING_HALL_URLS[diningHall]) return null;

  const page = await browser.newPage();
  try {
    await page.goto(DINING_HALL_URLS[diningHall], { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('Scraping nutritional data from:', DINING_HALL_URLS[diningHall]);
    
    const menuData = await page.evaluate(() => {
      const menuItems = {
        breakfast: {},
        lunch: {},
        dinner: {},
        latenight: {}
      };
      
      // Find all menu sections
      const menuSections = document.querySelectorAll('.menus.striped');
      
      menuSections.forEach(section => {
        // Get the meal type from the menu tab
        const menuType = section.getAttribute('data-date-range-title')?.toLowerCase() || '';
        let mealPeriod = 'lunch'; // Default to lunch for most dining halls

        if (menuType.includes('breakfast')) {
          mealPeriod = 'breakfast';
        } else if (menuType.includes('dinner')) {
          mealPeriod = 'dinner';
        } else if (menuType.includes('late') || menuType.includes('night')) {
          mealPeriod = 'latenight';
        }
        
        // Process each station in the section
        const stations = section.querySelectorAll('.wrapper');
        stations.forEach(station => {
          const stationName = station.querySelector('.station-title')?.textContent?.trim() || 'General';
          
          // Process each meal item in the station
          const items = station.querySelectorAll('.meal-item');
          items.forEach(item => {
            const foodName = item.querySelector('.meal-title')?.textContent?.trim();
            if (!foodName) return;
            
            // Get dietary preferences
            const dietaryPrefs = item.querySelector('.meal-prefs strong')?.textContent?.split(',')
              .map(pref => pref.trim()) || [];
            
            // Get allergens
            const allergenText = item.querySelector('.meal-allergens em')?.textContent;
            const contains = allergenText ? 
              allergenText.replace('Contains:', '').split(',')
                .map(allergen => allergen.trim()) : [];
            
            menuItems[mealPeriod][foodName] = {
              foodType: stationName,
              dietaryPreferences: dietaryPrefs,
              contains: contains
            };
          });
        });
      });
      
      return menuItems;
    });

    console.log('Scraped nutritional data:', menuData);
    return menuData;
  } catch (error) {
    console.error(`Error scraping nutritional data for ${diningHall}:`, error);
    return null;
  } finally {
    await page.close();
  }
}

async function scrapeMenuItems(page, mealType) {
  const items = await page.evaluate((currentMealType) => {
    const menuItems = [];
    const cols = document.querySelectorAll('.col');

    cols.forEach((col) => {
      const diningHall = col.querySelector('h3')?.textContent?.trim() || '';
      const hoursText = col.querySelector('.hours')?.textContent?.trim() || '';
      const menu = col.querySelector('.menu');
      
      if (!diningHall) return;

      const isClosed = hoursText.toLowerCase().includes('closed') || 
                      menu?.textContent?.toLowerCase().includes('closed for') ||
                      menu?.textContent?.toLowerCase().includes('no data available');

      const hours = isClosed ? "Closed" : hoursText;

      if (isClosed) {
        menuItems.push({
          mealType: currentMealType,
          diningHall,
          hours,
          foodType: "Status",
          foodName: "Closed"
        });
        return;
      }

      if (menu) {
        const foodItems = menu.querySelectorAll('.food-name');
        const foodTypes = menu.querySelectorAll('.food-type');
        
        let currentFoodType = 'General';
        let typeIndex = 0;

        if (foodItems.length === 0) {
          menuItems.push({
            mealType: currentMealType,
            diningHall,
            hours,
            foodType: "Status",
            foodName: "No items available"
          });
          return;
        }

        foodItems.forEach((foodItem) => {
          while (typeIndex < foodTypes.length) {
            const foodType = foodTypes[typeIndex];
            if (foodType.compareDocumentPosition(foodItem) & Node.DOCUMENT_POSITION_FOLLOWING) {
              currentFoodType = foodType.textContent?.trim() || 'General';
              typeIndex++;
            } else {
              break;
            }
          }

          const foodName = foodItem.textContent?.trim();
          if (foodName) {
            menuItems.push({
              mealType: currentMealType,
              diningHall,
              hours,
              foodType: currentFoodType,
              foodName: foodName.replace(/\s+/g, ' ').trim()
            });
          }
        });
      }
    });

    return menuItems;
  }, mealType);

  return items.filter(item => 
    item &&
    item.diningHall &&
    item.hours &&
    item.foodType &&
    item.foodName &&
    item.mealType
  );
}

// Separate the scraping logic from the response handling
async function scrapeMenuData() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const menuData = {
      breakfast: [],
      lunch: [],
      dinner: [],
      latenight: []
    };

    // Scrape menu data first
    for (const [mealType, url] of Object.entries(MEAL_URLS)) {
      const page = await browser.newPage();
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        const items = await scrapeMenuItems(page, mealType);
        menuData[mealType] = items;
        console.log(`Got ${items.length} items for ${mealType}`);
      } catch (error) {
        console.error(`Error scraping ${mealType}:`, error);
      } finally {
        await page.close();
      }
    }

    // Get a list of open dining halls
    const openDiningHalls = new Set();
    Object.values(menuData).forEach(mealItems => {
      mealItems.forEach(item => {
        if (!isDiningHallClosed([item], item.diningHall)) {
          openDiningHalls.add(item.diningHall);
        }
      });
    });

    console.log('Open dining halls:', Array.from(openDiningHalls));

    // Only scrape nutritional data for open dining halls
    const allDiningHalls = [...Object.keys(DINING_HALL_URLS), ...Object.keys(BARNARD_DINING_HALLS)];
    for (const diningHall of allDiningHalls) {
      // Skip if dining hall is closed
      if (!openDiningHalls.has(diningHall)) {
        console.log(`Skipping nutritional data for closed dining hall: ${diningHall}`);
        continue;
      }

      const nutritionalData = await scrapeNutritionalData(browser, diningHall);
      
      if (nutritionalData) {
        console.log(`Found ${diningHall} nutritional data, attempting to merge...`);
        // Merge nutritional data with menu items for each meal period
        Object.entries(menuData).forEach(([mealType, mealItems]) => {
          mealItems.forEach(item => {
            if (item.diningHall === diningHall) {
              // Try to find nutritional info in the corresponding meal period
              const nutritionalInfo = nutritionalData[mealType]?.[item.foodName];
              if (nutritionalInfo) {
                console.log('Found nutritional info for:', item.foodName);
                item.dietaryPreferences = nutritionalInfo.dietaryPreferences;
                item.contains = nutritionalInfo.contains;
              } else {
                // If not found in the specific meal period, try other periods
                const otherPeriods = Object.entries(nutritionalData)
                  .filter(([period]) => period !== mealType);
                
                for (const [_, periodData] of otherPeriods) {
                  const altNutritionalInfo = periodData[item.foodName];
                  if (altNutritionalInfo) {
                    console.log('Found nutritional info in different period for:', item.foodName);
                    item.dietaryPreferences = altNutritionalInfo.dietaryPreferences;
                    item.contains = altNutritionalInfo.contains;
                    break;
                  }
                }
              }
            }
          });
        });
      } else if (Object.keys(BARNARD_DINING_HALLS).includes(diningHall)) {
        console.log(`Skipping nutritional data merge for ${diningHall} (Barnard dining hall)`);
      } else {
        console.log(`No nutritional data found for ${diningHall}`);
      }
    }

    return {
      success: true,
      data: menuData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Scraping error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch menu data',
      timestamp: new Date().toISOString()
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Modify getMenuData to check Supabase cache first
async function getMenuData(supabase) {
  const now = Date.now();
  
  // First check Supabase cache
  if (supabase) {
    console.log('Checking Supabase menu cache...');
    const { data: cachedMenu, error } = await supabase
      .from('menu_cache')
      .select('*')
      .gt('last_updated', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Menu cache fetch error:', error);
    } else if (cachedMenu && cachedMenu.length > 0) {
      console.log(`Found ${cachedMenu.length} items in Supabase cache`);
      // Transform cached data back into menu format
      const menuData = {
        success: true,
        data: cachedMenu.reduce((acc, item) => {
          if (!acc[item.mealType]) acc[item.mealType] = [];
          acc[item.mealType].push({
            mealType: item.mealType,
            diningHall: item.diningHall,
            hours: item.hours,
            foodType: item.foodType,
            foodName: item.foodName,
            dietaryPreferences: item.dietaryPreferences,
            contains: item.contains,
            nutritionalInfo: item.nutritionalInfo
          });
          return acc;
        }, {}),
        timestamp: new Date().toISOString()
      };
      return menuData;
    }
  }

  // Then check memory cache
  if (scrapedMenuData && lastScrapeTime && (now - lastScrapeTime < SCRAPE_INTERVAL)) {
    console.log('Using memory cached menu data');
    return scrapedMenuData;
  }

  // Only scrape if we need to
  console.log('No valid cache found, scraping fresh menu data');
  const freshData = await scrapeMenuData();
  if (freshData.success) {
    scrapedMenuData = freshData;
    lastScrapeTime = now;
    console.log('Menu data cached in memory at:', new Date(lastScrapeTime).toISOString());
  }
  return freshData;
}

// Update the menu endpoint handler to use getMenuData
router.get('/', async (req, res) => {
  try {
    const menuData = await getMenuData(req.supabase);
    
    if (!menuData.success) {
      throw new Error(menuData.error || 'Failed to fetch menu data');
    }

    // Process menu items with nutrition data
    const processedMenuData = { ...menuData };
    const allProcessedItems = []; // Keep track of all items for ranking
    
    for (const [mealType, items] of Object.entries(menuData.data)) {
      const processedItems = [];
      for (const item of items) {
        if (item.foodName !== "Closed" && item.foodName !== "No items available") {
          try {
            // Get nutrition data for each item
            const nutrition = await req.nutritionService.getNutritionData(
              item.foodName,
              item.diningHall
            );
            
            const processedItem = {
              ...item,
              nutrition,
              healthScore: req.nutritionService.calculateHealthScore(nutrition)
            };
            
            processedItems.push(processedItem);
            allProcessedItems.push(processedItem);
          } catch (error) {
            console.error(`Error processing nutrition for ${item.foodName}:`, error);
            processedItems.push(item); // Keep the item even if nutrition processing fails
          }
        } else {
          processedItems.push(item);
        }
      }
      processedMenuData.data[mealType] = processedItems;
    }

    // Calculate top recommendations
    const recommendations = {
      healthiest: [],
      byNutrient: {
        highProtein: [],
        lowCalorie: [],
        highFiber: []
      },
      byDiningHall: {}
    };

    // Sort all items by health score for overall healthiest options
    recommendations.healthiest = allProcessedItems
      .filter(item => item.healthScore) // Only include items with health scores
      .sort((a, b) => b.healthScore - a.healthScore)
      .slice(0, 5)
      .map(item => ({
        foodName: item.foodName,
        diningHall: item.diningHall,
        mealType: item.mealType,
        healthScore: item.healthScore,
        nutrition: item.nutrition
      }));

    // Sort by specific nutrients
    recommendations.byNutrient.highProtein = allProcessedItems
      .filter(item => item.nutrition?.protein)
      .sort((a, b) => b.nutrition.protein - a.nutrition.protein)
      .slice(0, 3);

    recommendations.byNutrient.lowCalorie = allProcessedItems
      .filter(item => item.nutrition?.calories)
      .sort((a, b) => a.nutrition.calories - b.nutrition.calories)
      .slice(0, 3);

    recommendations.byNutrient.highFiber = allProcessedItems
      .filter(item => item.nutrition?.fiber)
      .sort((a, b) => b.nutrition.fiber - a.nutrition.fiber)
      .slice(0, 3);

    // Group by dining hall and calculate average scores
    const diningHallGroups = allProcessedItems.reduce((acc, item) => {
      if (!acc[item.diningHall]) {
        acc[item.diningHall] = {
          items: [],
          totalHealthScore: 0,
          count: 0
        };
      }
      if (item.healthScore) {
        acc[item.diningHall].items.push(item);
        acc[item.diningHall].totalHealthScore += item.healthScore;
        acc[item.diningHall].count++;
      }
      return acc;
    }, {});

    // Calculate average scores for each dining hall
    recommendations.byDiningHall = Object.entries(diningHallGroups)
      .map(([diningHall, data]) => ({
        diningHall,
        avgHealthScore: data.count > 0 ? data.totalHealthScore / data.count : 0,
        menuSize: data.count,
        topItems: data.items
          .sort((a, b) => b.healthScore - a.healthScore)
          .slice(0, 3)
      }))
      .sort((a, b) => b.avgHealthScore - a.avgHealthScore);

    res.json({
      ...processedMenuData,
      recommendations
    });

  } catch (error) {
    console.error('Menu endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch menu data'
    });
  }
});

// Modify the recommend endpoint to use the same data
router.get('/recommend', async (req, res) => {
  try {
    const menuData = await getMenuData(req.supabase);
    if (!menuData.success) {
      throw new Error(menuData.error || 'Failed to fetch menu data');
    }

    // Group meals by dining hall
    const diningHallMeals = {};
    Object.values(menuData.data).forEach(items => {
      items.forEach(item => {
        if (item.foodName !== "Closed" && item.foodName !== "No items available") {
          if (!diningHallMeals[item.diningHall]) {
            diningHallMeals[item.diningHall] = new Set();
          }
          diningHallMeals[item.diningHall].add(item.foodName);
        }
      });
    });

    // Get nutrition data for each dining hall
    const nutritionData = {};
    for (const [diningHall, meals] of Object.entries(diningHallMeals)) {
      nutritionData[diningHall] = await req.nutritionService.getNutritionDataBatch(
        [...meals],
        diningHall
      );
    }

    // Process meals with the pre-fetched nutrition data
    const processedMeals = [];
    for (const [mealType, items] of Object.entries(menuData.data)) {
      for (const item of items) {
        if (item.foodName !== "Closed" && item.foodName !== "No items available") {
          const nutrition = nutritionData[item.diningHall]?.[item.foodName];
          const healthScore = req.nutritionService.calculateHealthScore(nutrition);
          
          processedMeals.push({
            dining_hall: item.diningHall,
            meal_name: item.foodName,
            meal_type: mealType,
            nutrition,
            healthScore,
            analyzed: new Date().toISOString()
          });
        }
      }
    }

    // Group by dining hall and calculate scores
    const diningHallScores = processedMeals.reduce((acc, meal) => {
      if (!acc[meal.dining_hall]) {
        acc[meal.dining_hall] = {
          dining_hall: meal.dining_hall,
          meals: [],
          avgHealthScore: 0,
          avgCalories: 0,
          menuSize: 0
        };
      }
      
      acc[meal.dining_hall].meals.push(meal);
      acc[meal.dining_hall].avgHealthScore += meal.healthScore;
      acc[meal.dining_hall].avgCalories += meal.nutrition.calories;
      acc[meal.dining_hall].menuSize++;
      
      return acc;
    }, {});

    // Calculate averages and sort dining halls
    const recommendations = Object.values(diningHallScores)
      .map(hall => ({
        ...hall,
        avgHealthScore: hall.avgHealthScore / hall.menuSize,
        avgCalories: hall.avgCalories / hall.menuSize
      }))
      .sort((a, b) => b.avgHealthScore - a.avgHealthScore);

    res.json({
      success: true,
      data: {
        recommendations,
        processedMeals
      }
    });

  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recommendations'
    });
  }
});

module.exports = router; 