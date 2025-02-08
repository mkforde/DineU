const axios = require('axios');

// USDA API configuration
const USDA_CONFIG = {
    apiKey: 'VrFMgaqL4bACMwMWBwamewekNdYPQr0Gfta9AQpM',
    baseUrl: 'https://api.nal.usda.gov/fdc/v1'
};

class NutritionService {
    constructor(supabase) {
        this.supabase = supabase;
        this.memCache = new Map(); // Keep memory cache for current session
    }

    async searchFood(query) {
        try {
            const response = await axios.get(`${USDA_CONFIG.baseUrl}/foods/search`, {
                params: {
                    api_key: USDA_CONFIG.apiKey,
                    query: query,
                    pageSize: 1,
                    dataType: ['Survey (FNDDS)']  // Use FNDDS for prepared meals
                }
            });

            if (response.data && response.data.foods && response.data.foods.length > 0) {
                return response.data.foods[0];
            }
        } catch (error) {
            console.error(`Error searching USDA for ${query}:`, error.message);
        }
        return null;
    }

    async getNutritionData(mealName) {
        // Check memory cache first
        if (this.memCache.has(mealName)) {
            return this.memCache.get(mealName);
        }

        // Check Supabase cache
        try {
            const { data: cachedData } = await this.supabase
                .from('nutrition_cache')
                .select('nutrition_data')
                .eq('meal_name', mealName)
                .single();

            if (cachedData) {
                this.memCache.set(mealName, cachedData.nutrition_data);
                return cachedData.nutrition_data;
            }

            // If not in cache, fetch from USDA
            const foodItem = await this.searchFood(mealName);
            const nutritionData = await this.processUSDAData(foodItem);

            // Save to Supabase cache
            await this.supabase
                .from('nutrition_cache')
                .upsert({
                    meal_name: mealName,
                    nutrition_data: nutritionData,
                    last_updated: new Date().toISOString()
                });

            // Save to memory cache
            this.memCache.set(mealName, nutritionData);
            return nutritionData;

        } catch (error) {
            console.error(`Cache error for ${mealName}:`, error);
            return this.getDefaultNutrition();
        }
    }

    calculateHealthScore(nutrition) {
        // Enhanced scoring system using more nutrients
        const IDEAL_RANGES = {
            calories: { min: 400, max: 800, weight: 0.25 },
            protein: { min: 15, max: 30, weight: 0.25 },
            carbs: { min: 45, max: 75, weight: 0.15 },
            fat: { min: 10, max: 25, weight: 0.15 },
            fiber: { min: 4, max: 10, weight: 0.1 },
            sodium: { min: 200, max: 800, weight: 0.1 }  // mg
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
        console.log(`Analyzing meal: ${meal.meal_name}`);
        const nutrition = await this.getNutritionData(meal.meal_name);
        const healthScore = this.calculateHealthScore(nutrition);

        return {
            ...meal,
            nutrition,
            healthScore,
            analyzed: new Date().toISOString()
        };
    }

    getDefaultNutrition() {
        // Return default values if API call fails
        console.log(`Using default values for: ${mealName}`);
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

    async processUSDAData(foodItem) {
        // Extract nutrients from USDA data
        const getNutrientValue = (nutrients, nutrientName) => {
            const nutrient = nutrients.find(n => n.nutrientName.toLowerCase().includes(nutrientName.toLowerCase()));
            return nutrient ? nutrient.value : 0;
        };

        const nutritionData = {
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

        return nutritionData;
    }
}

module.exports = NutritionService; 