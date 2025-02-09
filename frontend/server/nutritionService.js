import { supabase } from '../lib/supabase';

// Constants for calculations
const MAX_CALORIES = 1500.0;
const VARIETY_THRESHOLD = 0.5;
const PUNISHMENT_FACTOR = 0.8;
const DAYS_THRESHOLD = 0;
const RECENCY_PENALTY = 0.8;

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

    // Check if dining hall is currently open
    static isOpen(operatingHours) {
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const currentTime = now.getHours() * 100 + now.getMinutes();

        const todayHours = operatingHours[currentDay];
        if (!todayHours) return false;

        return todayHours.some(period => {
            const [open, close] = period;
            return currentTime >= open && currentTime <= close;
        });
    }

    // Calculate Nutri-Score with more detailed scoring
    static calculateNutriScore(nutritionData) {
        const { calories, protein, total_fat, fiber, sodium, vitamins = 0, minerals = 0 } = nutritionData;
        
        let points = 0;
        
        // Negative points (higher values = worse)
        points -= (calories / 100);
        points -= (total_fat * 2);
        points -= (sodium / 100);
        
        // Positive points (higher values = better)
        points += (protein * 2);
        points += (fiber * 1.5);
        points += (vitamins);
        points += (minerals);
        
        // Convert to letter grade with specific ranges
        const score = {
            grade: '',
            points: points,
            color: '',
            description: ''
        };

        if (points >= 5) {
            score.grade = 'A';
            score.color = '#038141';
            score.description = 'Excellent nutritional quality';
        } else if (points >= 0) {
            score.grade = 'B';
            score.color = '#85BB2F';
            score.description = 'Good nutritional quality';
        } else if (points >= -5) {
            score.grade = 'C';
            score.color = '#FFC734';
            score.description = 'Average nutritional quality';
        } else if (points >= -10) {
            score.grade = 'D';
            score.color = '#FF7D1A';
            score.description = 'Poor nutritional quality';
        } else {
            score.grade = 'E';
            score.color = '#FF0D0D';
            score.description = 'Unhealthy nutritional quality';
        }

        return score;
    }

    // Calculate food variety score
    static calculateFoodVariety(visits) {
        const uniqueMeals = new Set(visits.map(visit => visit.meal_name)).size;
        const totalVisits = visits.length;
        let varietyScore = uniqueMeals / totalVisits;
        
        if (varietyScore < VARIETY_THRESHOLD) {
            varietyScore *= PUNISHMENT_FACTOR;
        }
        
        return varietyScore;
    }

    // Calculate recency penalty
    static calculateRecencyPenalty(lastVisitDate) {
        const daysSinceVisit = Math.floor(
            (new Date() - new Date(lastVisitDate)) / (1000 * 60 * 60 * 24)
        );
        
        return daysSinceVisit < DAYS_THRESHOLD ? RECENCY_PENALTY : 1.0;
    }

    // Score dining hall based on preference
    static scoreDiningHall(diningHall, preference) {
        const normalizedCalories = (MAX_CALORIES - diningHall.calories) / MAX_CALORIES;
        
        let baseScore;
        switch (preference) {
            case 'healthy':
                baseScore = 0.5 * diningHall.meal_health + 
                           0.3 * normalizedCalories + 
                           0.2 * diningHall.food_variety;
                break;
            case 'variety':
                baseScore = 0.3 * diningHall.meal_health + 
                           0.2 * normalizedCalories + 
                           0.5 * diningHall.food_variety;
                break;
            default: // balanced
                baseScore = 0.4 * diningHall.meal_health + 
                           0.3 * normalizedCalories + 
                           0.3 * diningHall.food_variety;
        }
        
        return baseScore * diningHall.recent_penalty;
    }

    // Get dining hall recommendations with operating hours check
    static async getRecommendations(preference = 'balanced') {
        try {
            // Fetch dining hall data including operating hours
            const { data: diningHalls, error: diningError } = await supabase
                .from('dining_halls')
                .select('*, operating_hours');

            if (diningError) throw diningError;

            // Fetch visit history
            const { data: visits, error: visitsError } = await supabase
                .from('dining_visits')
                .select('*');

            if (visitsError) throw visitsError;

            // Filter out closed dining halls and process remaining ones
            const processedHalls = diningHalls
                .filter(hall => this.isOpen(hall.operating_hours))
                .map(hall => {
                    const hallVisits = visits.filter(v => v.dining_hall === hall.name);
                    const nutriScore = this.calculateNutriScore(hall);
                    
                    return {
                        ...hall,
                        food_variety: this.calculateFoodVariety(hallVisits),
                        recent_penalty: this.calculateRecencyPenalty(
                            hallVisits.length > 0 
                                ? Math.max(...hallVisits.map(v => new Date(v.visit_date)))
                                : new Date(0)
                        ),
                        nutri_score: nutriScore.grade,
                        nutri_color: nutriScore.color,
                        nutri_description: nutriScore.description,
                        is_open: true
                    };
                });

            // Score and sort dining halls
            const scoredHalls = processedHalls
                .map(hall => ({
                    ...hall,
                    score: this.scoreDiningHall(hall, preference)
                }))
                .sort((a, b) => b.score - a.score);

            // Add closed dining halls at the end with is_open: false
            const closedHalls = diningHalls
                .filter(hall => !this.isOpen(hall.operating_hours))
                .map(hall => ({
                    ...hall,
                    nutri_score: this.calculateNutriScore(hall),
                    is_open: false,
                    score: -1 // Ensure closed halls are at the end
                }));

            return {
                open: scoredHalls,
                closed: closedHalls,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error getting recommendations:', error);
            throw error;
        }
    }

    // Helper method to get operating hours status message
    static getStatusMessage(operatingHours) {
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = now.getHours() * 100 + now.getMinutes();

        const todayHours = operatingHours[currentDay];
        if (!todayHours) return "Closed today";

        const nextPeriod = todayHours.find(([open, close]) => currentTime <= close);
        if (!nextPeriod) return "Closed for the day";
        
        if (currentTime < nextPeriod[0]) {
            const openTime = this.formatTime(nextPeriod[0]);
            return `Opens at ${openTime}`;
        }
        
        const closeTime = this.formatTime(nextPeriod[1]);
        return `Open until ${closeTime}`;
    }

    static formatTime(time) {
        const hours = Math.floor(time / 100);
        const minutes = time % 100;
        return `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
    }
}

export default NutritionService; 