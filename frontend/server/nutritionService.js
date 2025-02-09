const axios = require('axios');

// USDA API configuration
const USDA_CONFIG = {
    apiKey: 'VrFMgaqL4bACMwMWBwamewekNdYPQr0Gfta9AQpM',
    baseUrl: 'https://api.nal.usda.gov/fdc/v1'
};

class NutritionService {
    constructor(supabase) {
        this.supabase = supabase;
        this.memCache = new Map();
        this.batchQueue = [];
        this.batchTimeout = null;
        this.BATCH_SIZE = 25; // Max items per request
        this.BATCH_WAIT = 1000; // Wait 1 second to collect items
        
        // Add common food mappings to the class
        this.commonFoodMappings = {
            'french toast': 'french toast',
            'scrambled eggs': 'scrambled eggs',
            'hash brown': 'hash brown potatoes',
            'ham': 'ham',
            'turkey sausage': 'turkey sausage',
            'biscuits': 'biscuit',
            'carrots': 'carrots',
            'egg': 'egg',
            'potatoes': 'potatoes',
            'chicken': 'chicken',
            'pizza': 'pizza',
            'rice': 'rice',
            'salad': 'salad',
            'muffin': 'muffin',
            'yogurt': 'yogurt',
            'granola': 'granola'
        };
    }

    // Add getter method for food mappings
    getCommonFoodMappings() {
        return this.commonFoodMappings;
    }

    async getNutritionDataBatch(meals, diningHall) {
        if (!meals || meals.length === 0) return {};

        const results = {};
        const uncachedMeals = [];

        // Check memory and Supabase cache
        for (const meal of meals) {
            const cacheKey = `${meal}-${diningHall}`;
            if (this.memCache.has(cacheKey)) {
                results[meal] = this.memCache.get(cacheKey);
                continue;
            }

            if (this.supabase) {
                const { data: cachedData } = await this.supabase
                    .from('nutrition_cache')
                    .select('nutrition_data')
                    .eq('meal_name', meal)
                    .eq('dining_hall', diningHall)
                    .single();

                if (cachedData) {
                    results[meal] = cachedData.nutrition_data;
                    this.memCache.set(cacheKey, cachedData.nutrition_data);
                    continue;
                }
            }

            uncachedMeals.push(meal);
        }

        // Process uncached meals individually
        for (const meal of uncachedMeals) {
            try {
                console.log(`Fetching nutrition data for: ${meal} at ${diningHall}`);
                const foodItem = await this.searchFood(meal);
                const nutritionData = foodItem ? 
                    this.processUSDAData(foodItem) : 
                    this.getDefaultNutrition();

                results[meal] = nutritionData;
                const cacheKey = `${meal}-${diningHall}`;
                this.memCache.set(cacheKey, nutritionData);

                // Cache in Supabase
                if (this.supabase) {
                    try {
                        await this.supabase
                            .from('nutrition_cache')
                            .upsert({
                                meal_name: meal,
                                dining_hall: diningHall,
                                nutrition_data: nutritionData,
                                last_updated: new Date().toISOString()
                            });
                        console.log(`Cached nutrition data for: ${meal} at ${diningHall}`);
                    } catch (e) {
                        console.error(`Supabase cache error for ${meal} at ${diningHall}:`, e);
                    }
                }
            } catch (error) {
                console.error(`Error processing ${meal} at ${diningHall}:`, error);
                results[meal] = this.getDefaultNutrition();
            }
        }

        return results;
    }

    async searchFoodBatch(meals) {
        const results = {};
        const commonMappings = this.getCommonFoodMappings();

        try {
            // First try exact matches
            const response = await axios.get(`${USDA_CONFIG.baseUrl}/foods/search`, {
                params: {
                    api_key: USDA_CONFIG.apiKey,
                    query: meals.join(' OR '),
                    pageSize: meals.length,
                    dataType: 'Survey (FNDDS)',
                },
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.data?.foods) {
                for (const food of response.data.foods) {
                    const matchedMeal = meals.find(meal => 
                        food.description.toLowerCase().includes(meal.toLowerCase())
                    );
                    if (matchedMeal) {
                        results[matchedMeal] = food;
                    }
                }
            }

            // For unmatched meals, try common mappings
            const unmatchedMeals = meals.filter(meal => !results[meal]);
            for (const meal of unmatchedMeals) {
                const basicTerm = Object.keys(commonMappings).find(key => 
                    meal.toLowerCase().includes(key)
                );

                if (basicTerm) {
                    try {
                        const mappedResponse = await axios.get(`${USDA_CONFIG.baseUrl}/foods/search`, {
                            params: {
                                api_key: USDA_CONFIG.apiKey,
                                query: commonMappings[basicTerm],
                                pageSize: 1,
                                dataType: 'Survey (FNDDS)'
                            },
                            headers: {
                                'Accept': 'application/json'
                            }
                        });

                        if (mappedResponse.data?.foods?.length > 0) {
                            results[meal] = mappedResponse.data.foods[0];
                        }
                    } catch (error) {
                        console.error(`Mapping error for ${meal}:`, error.message);
                    }
                }
            }
        } catch (error) {
            console.error('Batch search error:', error.message);
        }

        return results;
    }

    async getNutritionData(mealName, diningHall) {
        if (!mealName) {
            console.log('No meal name provided, using defaults');
            return this.getDefaultNutrition();
        }

        const cacheKey = `${mealName}-${diningHall}`;

        // Check memory cache first
        if (this.memCache.has(cacheKey)) {
            console.log(`Found ${mealName} in memory cache for ${diningHall}`);
            return this.memCache.get(cacheKey);
        }

        try {
            // Check Supabase cache if available
            if (this.supabase) {
                console.log(`Checking Supabase cache for ${mealName} at ${diningHall}`);
                const { data: cachedData } = await this.supabase
                    .from('nutrition_cache')
                    .select('nutrition_data')
                    .eq('meal_name', mealName)
                    .eq('dining_hall', diningHall)
                    .single();

                if (cachedData) {
                    console.log(`Found ${mealName} in Supabase cache for ${diningHall}`);
                    this.memCache.set(cacheKey, cachedData.nutrition_data);
                    return cachedData.nutrition_data;
                }
            }

            // If not in cache, fetch from USDA
            console.log(`Fetching USDA data for ${mealName} at ${diningHall}`);
            const foodItem = await this.searchFood(mealName);
            if (foodItem) {
                const nutritionData = this.processUSDAData(foodItem);

                // Cache in memory
                this.memCache.set(cacheKey, nutritionData);

                // Cache in Supabase if available
                if (this.supabase) {
                    try {
                        await this.supabase
                            .from('nutrition_cache')
                            .upsert({
                                meal_name: mealName,
                                dining_hall: diningHall,
                                nutrition_data: nutritionData,
                                last_updated: new Date().toISOString()
                            });
                        console.log(`Cached nutrition data for ${mealName} at ${diningHall}`);
                    } catch (e) {
                        console.error(`Supabase cache error for ${mealName} at ${diningHall}:`, e);
                    }
                }

                return nutritionData;
            }
        } catch (error) {
            console.error(`Cache error for ${mealName} at ${diningHall}:`, error);
        }

        console.log(`Using default nutrition for ${mealName} at ${diningHall}`);
        return this.getDefaultNutrition();
    }

    getDefaultNutrition() {
        return {
            calories: 250,
            protein: 8,
            carbs: 30,
            fat: 10,
            fiber: 2,
            sugars: 5,
            sodium: 500,
            calcium: 100,
            iron: 2,
            potassium: 200,
            servingSize: 100,
            servingUnit: 'g'
        };
    }

    processUSDAData(foodItem) {
        if (!foodItem || !foodItem.foodNutrients) {
            return this.getDefaultNutrition();
        }

        const getNutrientValue = (nutrients, nutrientName) => {
            const nutrient = nutrients.find(n => 
                n.nutrientName && n.nutrientName.toLowerCase().includes(nutrientName.toLowerCase())
            );
            return nutrient ? nutrient.value : 0;
        };

        return {
            calories: getNutrientValue(foodItem.foodNutrients, 'Energy'),
            protein: getNutrientValue(foodItem.foodNutrients, 'Protein'),
            carbs: getNutrientValue(foodItem.foodNutrients, 'Carbohydrate'),
            fat: getNutrientValue(foodItem.foodNutrients, 'Total lipid (fat)'),
            fiber: getNutrientValue(foodItem.foodNutrients, 'Fiber'),
            sugars: getNutrientValue(foodItem.foodNutrients, 'Sugars'),
            sodium: getNutrientValue(foodItem.foodNutrients, 'Sodium'),
            calcium: getNutrientValue(foodItem.foodNutrients, 'Calcium'),
            iron: getNutrientValue(foodItem.foodNutrients, 'Iron'),
            potassium: getNutrientValue(foodItem.foodNutrients, 'Potassium'),
            servingSize: foodItem.servingSize || 100,
            servingUnit: foodItem.servingSizeUnit || 'g'
        };
    }

    async searchFood(query) {
        if (!query) return null;

        try {
            const response = await axios.get(`${USDA_CONFIG.baseUrl}/foods/search`, {
                params: {
                    api_key: USDA_CONFIG.apiKey,
                    query: query.toLowerCase(),
                    pageSize: 1,
                    dataType: 'Survey (FNDDS)',
                    requireAllWords: true
                },
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.data && response.data.foods && response.data.foods.length > 0) {
                console.log(`Found USDA match for: ${query}`);
                return response.data.foods[0];
            } else {
                // Try a more generic search if exact match fails
                const genericQuery = query.split(' ')[0];
                const genericResponse = await axios.get(`${USDA_CONFIG.baseUrl}/foods/search`, {
                    params: {
                        api_key: USDA_CONFIG.apiKey,
                        query: genericQuery.toLowerCase(),
                        pageSize: 1,
                        dataType: 'Survey (FNDDS)'
                    },
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (genericResponse.data && genericResponse.data.foods && genericResponse.data.foods.length > 0) {
                    console.log(`Found generic USDA match for: ${query} using ${genericQuery}`);
                    return genericResponse.data.foods[0];
                }
            }
        } catch (error) {
            if (error.response) {
                console.error(`USDA API error for ${query}:`, {
                    status: error.response.status,
                    data: error.response.data
                });
            } else {
                console.error(`Error searching USDA for ${query}:`, error.message);
            }
        }

        // If no match found or error occurred, use a mapping for common items
        const commonFoodMappings = {
            'french toast': 'french toast',
            'scrambled eggs': 'scrambled eggs',
            'hash brown': 'hash brown potatoes',
            'ham': 'ham',
            'turkey sausage': 'turkey sausage',
            'biscuits': 'biscuit',
            'carrots': 'carrots',
            'egg': 'egg',
            'potatoes': 'potatoes',
            'chicken': 'chicken',
            'pizza': 'pizza',
            'rice': 'rice',
            'salad': 'salad',
            'muffin': 'muffin',
            'yogurt': 'yogurt',
            'granola': 'granola'
        };

        // Try to find a basic mapping
        const basicTerm = Object.keys(commonFoodMappings).find(key => 
            query.toLowerCase().includes(key)
        );

        if (basicTerm) {
            try {
                const mappedResponse = await axios.get(`${USDA_CONFIG.baseUrl}/foods/search`, {
                    params: {
                        api_key: USDA_CONFIG.apiKey,
                        query: commonFoodMappings[basicTerm],
                        pageSize: 1,
                        dataType: 'Survey (FNDDS)'
                    },
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (mappedResponse.data?.foods?.length > 0) {
                    console.log(`Found mapped USDA match for: ${query} using ${basicTerm}`);
                    return mappedResponse.data.foods[0];
                }
            } catch (mappingError) {
                console.error(`Error with mapped search for ${query}:`, mappingError.message);
            }
        }

        return null;
    }

    calculateHealthScore(nutrition) {
        const IDEAL_RANGES = {
            calories: { min: 400, max: 800, weight: 0.25 },
            protein: { min: 15, max: 30, weight: 0.25 },
            carbs: { min: 45, max: 75, weight: 0.15 },
            fat: { min: 10, max: 25, weight: 0.15 },
            fiber: { min: 4, max: 10, weight: 0.1 },
            sodium: { min: 200, max: 800, weight: 0.1 }
        };

        let totalScore = 0;
        let totalWeight = 0;

        for (const [nutrient, range] of Object.entries(IDEAL_RANGES)) {
            if (nutrition[nutrient]) {
                const score = this._scoreInRange(nutrition[nutrient], range);
                totalScore += score * range.weight;
                totalWeight += range.weight;
            }
        }

        return totalWeight > 0 ? totalScore / totalWeight : 0;
    }

    _scoreInRange(value, range) {
        if (value >= range.min && value <= range.max) return 1;
        if (value < range.min) return value / range.min;
        return range.max / value;
    }

    async analyzeMeal(meal) {
        if (!meal || !meal.meal_name || !meal.dining_hall) {
            console.error('Invalid meal data provided');
            return null;
        }

        console.log(`Analyzing meal: ${meal.meal_name} at ${meal.dining_hall}`);
        const nutrition = await this.getNutritionData(meal.meal_name, meal.dining_hall);
        const healthScore = this.calculateHealthScore(nutrition);

        return {
            ...meal,
            nutrition,
            healthScore,
            analyzed: new Date().toISOString()
        };
    }
}

module.exports = NutritionService; 