import pandas as pd
import requests
import time
from typing import List, Dict
import sys
import json
from fuzzywuzzy import fuzz
from pathlib import Path

#############################
# Configuration
#############################
#  API credentials
APP_ID = "331d658b"
APP_KEY = "0e9c27886b9ace084e367677fbe2c73c"

# Reference values for normalization
MAX_CALORIES = 1500.0
REFERENCE_PROTEIN = 50.0
REFERENCE_CARBS = 150.0
REFERENCE_FAT = 70.0

# Database configuration
NUTRITIONIX_DB = "nutritionix_db.json"
FUZZY_MATCH_THRESHOLD = 85

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
        print(f"Querying Nutritionix for: {query}", file=sys.stderr)
        sys.stderr.flush()
        
        if response.status_code == 200:
            result = response.json()
            foods = result.get("foods", [])
            
            if foods:
                food = foods[0]
                return {
                    "calories": food.get("nf_calories", 0),
                    "protein": food.get("nf_protein", 0),
                    "total_carbohydrate": food.get("nf_total_carbohydrate", 0),
                    "total_fat": food.get("nf_total_fat", 0)
                }
    except Exception as e:
        print(f"Error querying Nutritionix for {query}: {e}", file=sys.stderr)
        sys.stderr.flush()
    
    return None

def get_or_create_nutrition_db(menu_items: List[Dict]) -> Dict:
    """Get nutrition database or create it if doesn't exist"""
    # Try to load existing database
    if Path(NUTRITIONIX_DB).exists():
        try:
            with open(NUTRITIONIX_DB) as f:
                db = json.load(f)
                print(f"Loaded nutrition database with {len(db['meals'])} meals", file=sys.stderr)
                return db['meals']
        except Exception as e:
            print(f"Error loading nutrition database: {e}", file=sys.stderr)
    
    # Create new database from menu items
    print("Building new nutrition database...", file=sys.stderr)
    nutrition_db = {}
    
    # Get unique meals
    unique_meals = set()
    for item in menu_items:
        # Log the item structure to debug
        print(f"Processing menu item: {item}", file=sys.stderr)
        
        if (item.get('meal_name') and  # Use get() to avoid KeyError
            item['meal_name'] != "Closed" and 
            item['meal_name'] != "No items available" and 
            item.get('dining_hall') is not None):
            unique_meals.add(item['meal_name'])
    
    print(f"Found {len(unique_meals)} unique meals to process", file=sys.stderr)
    sys.stderr.flush()
    
    # Get nutrition data for each unique meal
    for meal in unique_meals:
        if meal not in nutrition_db:
            nutrients = get_nutrients_from_nutritionix(meal)
            if nutrients:
                nutrition_db[meal] = nutrients
                time.sleep(0.5)  # Rate limiting
            else:
                print(f"No nutrients found for {meal}, using defaults", file=sys.stderr)
                nutrition_db[meal] = {
                    "calories": 250,
                    "protein": 8,
                    "total_carbohydrate": 30,
                    "total_fat": 10
                }
    
    # Save database
    try:
        with open(NUTRITIONIX_DB, 'w') as f:
            json.dump({
                "meals": nutrition_db,
                "metadata": {
                    "last_updated": time.strftime("%Y-%m-%d"),
                    "version": "1.0",
                    "source": "Nutritionix API"
                }
            }, f, indent=2)
        print(f"Saved nutrition database with {len(nutrition_db)} meals", file=sys.stderr)
    except Exception as e:
        print(f"Error saving nutrition database: {e}", file=sys.stderr)
    
    return nutrition_db

def process_menu_data(menu_items: List[Dict]) -> pd.DataFrame:
    """Convert menu items from scraper into DataFrame format"""
    rows = []
    print("\nProcessing menu items:", file=sys.stderr)
    for item in menu_items:
        # Log each item being processed
        print(f"Item: {item}", file=sys.stderr)
        
        if (item.get('meal_name') and  # Use get() to avoid KeyError
            item['meal_name'] != "Closed" and 
            item['meal_name'] != "No items available" and 
            item.get('dining_hall') is not None):
            rows.append({
                'dining_hall': item['dining_hall'],
                'meal_name': item['meal_name']
            })
    
    df = pd.DataFrame(rows)
    print(f"\nCreated DataFrame with {len(df)} rows", file=sys.stderr)
    print("Sample of DataFrame:", file=sys.stderr)
    print(df.head(), file=sys.stderr)
    return df

def compute_meal_health(row):
    """Compute health score for a meal"""
    norm_calories = (MAX_CALORIES - row["calories"]) / MAX_CALORIES
    norm_calories = max(0, min(norm_calories, 1))
    
    norm_protein = row["protein"] / REFERENCE_PROTEIN
    norm_protein = max(0, min(norm_protein, 1))
    
    norm_carbs = 1 - (row["total_carbohydrate"] / REFERENCE_CARBS)
    norm_carbs = max(0, min(norm_carbs, 1))
    
    norm_fat = 1 - (row["total_fat"] / REFERENCE_FAT)
    norm_fat = max(0, min(norm_fat, 1))
    
    return (norm_calories + norm_protein + norm_carbs + norm_fat) / 4.0

def analyze_meals(menu_items: List[Dict]):
    """Analyze nutritional content of menu items"""
    # Get or create nutrition database
    nutrition_db = get_or_create_nutrition_db(menu_items)
    
    # Process menu items
    df = process_menu_data(menu_items)
    print(f"Processing {len(df)} meals across {len(df['dining_hall'].unique())} dining halls", file=sys.stderr)
    
    # Add nutritional information
    print("Adding nutritional information to meals...", file=sys.stderr)
    for idx, row in df.iterrows():
        meal_name = row['meal_name']
        nutrients = nutrition_db.get(meal_name)
        
        if not nutrients:
            # Try fuzzy matching
            best_match = None
            best_score = 0
            for db_meal in nutrition_db:
                score = fuzz.ratio(meal_name.lower(), db_meal.lower())
                if score > best_score and score >= FUZZY_MATCH_THRESHOLD:
                    best_score = score
                    best_match = db_meal
            
            if best_match:
                nutrients = nutrition_db[best_match]
                print(f"Matched '{meal_name}' with '{best_match}'", file=sys.stderr)
            else:
                nutrients = {
                    "calories": 250,
                    "protein": 8,
                    "total_carbohydrate": 30,
                    "total_fat": 10
                }
                print(f"No match found for {meal_name}, using defaults", file=sys.stderr)
        
        df.loc[idx, 'calories'] = nutrients['calories']
        df.loc[idx, 'protein'] = nutrients['protein']
        df.loc[idx, 'total_carbohydrate'] = nutrients['total_carbohydrate']
        df.loc[idx, 'total_fat'] = nutrients['total_fat']
    
    # Compute health scores
    print("Computing health scores...", file=sys.stderr)
    df['meal_health'] = df.apply(compute_meal_health, axis=1)
    
    # Log meal counts per dining hall
    print("\nMeal counts per dining hall:", file=sys.stderr)
    meal_counts = df.groupby('dining_hall').size()
    for hall, count in meal_counts.items():
        print(f"{hall}: {count} meals", file=sys.stderr)
    
    # Pass full meal data to recommender
    return {
        'meals_data': df.to_dict(orient='records'),
        'dining_averages': df.to_dict(orient='records')  # Pass full data instead of averages
    }

if __name__ == "__main__":
    try:
        print("meals.py starting...", file=sys.stderr)
        sys.stderr.flush()
        
        # Read input from stdin
        input_data = sys.stdin.read()
        print(f"Received input data length: {len(input_data)}", file=sys.stderr)
        sys.stderr.flush()
        
        # Parse menu items
        menu_items = json.loads(input_data)
        print(f"Processing {len(menu_items)} menu items", file=sys.stderr)
        sys.stderr.flush()
        
        # Analyze meals
        results = analyze_meals(menu_items)
        print("Analysis complete", file=sys.stderr)
        sys.stderr.flush()
        
        # Output results as JSON to stdout
        sys.stdout.write(json.dumps(results))
        sys.stdout.flush()
        
        print("meals.py finished", file=sys.stderr)
        sys.stderr.flush()
        sys.exit(0)
    except Exception as e:
        print(f"Error in meals.py: {str(e)}", file=sys.stderr)
        sys.stderr.flush()
        sys.exit(1)
