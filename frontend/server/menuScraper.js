const puppeteer = require('puppeteer');
const express = require('express');
const router = express.Router();

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

// Menu Controller Function
async function getMenu(req, res) {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

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

    res.json({ 
      success: true, 
      data: menuData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch menu data',
      timestamp: new Date().toISOString()
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Add route to the router
router.get('/', getMenu);

module.exports = router; 