import requests
import json
import time
from typing import Dict, List
import sys

# Nutritionix API credentials
APP_ID = "331d658b"
APP_KEY = "0e9c27886b9ace084e367677fbe2c73c"

def get_nutrients_from_nutritionix(query: str) -> Dict:
    """Get nutritional information from Nutritionix API"""
    url = "https://trackapi.nutritionix.com/v2/natural/nutrients"
    headers = {
        "Content-Type": "application/json",
        "x-app-id": APP_ID,
        "x-app-key": APP_KEY,
        "x-remote-user-id": "0"
    }
    data = {"query": query}
    
    try:
        response = requests.post(url, json=data, headers=headers)
        print(f"Querying: {query}")
        
        if response.status_code == 200:
            result = response.json()
            foods = result.get("foods", [])
            
            if foods:
                food = foods[0]
                return {
                    "calories": food.get("nf_calories", 0),
                    "protein": food.get("nf_protein", 0),
                    "total_carbohydrate": food.get("nf_total_carbohydrate", 0),
                    "total_fat": food.get("nf_total_fat", 0),
                    "serving_size": food.get("serving_weight_grams", 100),
                    "serving_unit": food.get("serving_unit", "g"),
                    "tags": []  # Will be filled based on nutritional content
                }
    except Exception as e:
        print(f"Error processing {query}: {e}")
    
    return None

def add_tags(meal_data: Dict, meal_name: str, dining_hall: str, meal_type: str) -> Dict:
    """Add relevant tags based on nutritional content and meal properties"""
    tags = []
    
    # Meal type tags
    if meal_type:
        tags.append(meal_type.lower())
    
    # Nutritional content tags
    if meal_data["protein"] > 20:
        tags.append("high-protein")
    if meal_data["calories"] < 300:
        tags.append("low-calorie")
    if meal_data["total_carbohydrate"] < 20:
        tags.append("low-carb")
    
    # Meal type tags
    meal_lower = meal_name.lower()
    if any(word in meal_lower for word in ["vegetarian", "vegan", "tofu"]):
        tags.append("vegetarian")
    if "vegan" in meal_lower:
        tags.append("vegan")
    if "salad" in meal_lower:
        tags.append("salad")
    if any(word in meal_lower for word in ["grilled", "grill"]):
        tags.append("grilled")
    
    # Add dining hall as tag
    if dining_hall:
        tags.append(dining_hall.lower().replace(" ", "-"))
    
    meal_data["tags"] = tags
    return meal_data

def build_nutrition_database():
    """Build comprehensive nutrition database from scraped menu data"""
    try:
        # Read scraped menu data from stdin
        print("Reading menu data...", file=sys.stderr)
        menu_data = json.load(sys.stdin)
        
        # Get unique meals
        unique_meals = {}  # meal_name -> {dining_hall, meal_type}
        for item in menu_data:
            if (item['foodName'] != "Closed" and 
                item['foodName'] != "No items available" and 
                item['diningHall'] is not None):
                unique_meals[item['foodName']] = {
                    'dining_hall': item['diningHall'],
                    'meal_type': item.get('mealType', '')
                }
        
        print(f"\nFound {len(unique_meals)} unique meals", file=sys.stderr)
        
        # Build nutrition database
        nutrition_db = {}
        for meal_name, info in unique_meals.items():
            if meal_name not in nutrition_db:  # Skip if already processed
                nutrients = get_nutrients_from_nutritionix(meal_name)
                if nutrients:
                    nutrition_db[meal_name] = add_tags(
                        nutrients, 
                        meal_name, 
                        info['dining_hall'],
                        info['meal_type']
                    )
                    time.sleep(1)  # Rate limiting
                else:
                    print(f"No nutrients found for: {meal_name}", file=sys.stderr)
        
        # Save database
        output = {
            "meals": nutrition_db,
            "metadata": {
                "last_updated": time.strftime("%Y-%m-%d"),
                "version": "1.0",
                "source": "Nutritionix API",
                "total_meals": len(nutrition_db)
            }
        }
        
        with open("nutritionix_db.json", "w") as f:
            json.dump(output, f, indent=2)
        
        print(f"\nCreated nutrition database with {len(nutrition_db)} meals", file=sys.stderr)
        return nutrition_db
        
    except Exception as e:
        print(f"Error building database: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    print("Building nutrition database from menu data...", file=sys.stderr)
    db = build_nutrition_database() 