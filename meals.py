import pandas as pd
import requests
import time

#############################
# Configuration
#############################
INPUT_CSV = "meals.csv"  # Input CSV file with columns: dining_hall, meal_name
OUTPUT_CSV = "meals_with_nutrients_and_health.csv"  # Enriched meals data output
DINING_AVERAGES_CSV = "dining_hall_averages.csv"      # Dining hall averages output

# Nutritionix API credentials (replace these with your actual credentials)
APP_ID = "331d658b"
APP_KEY = "0e9c27886b9ace084e367677fbe2c73c"

# Reference values for normalization (adjust as needed)
MAX_CALORIES = 1500.0       # Upper bound for calories
REFERENCE_PROTEIN = 50.0    # Reference protein (grams)
REFERENCE_CARBS = 150.0     # Reference total carbohydrate (grams)
REFERENCE_FAT = 70.0        # Reference total fat (grams)

#############################
# Nutritionix API Function
#############################
def get_nutrients_from_nutritionix(query, app_id, app_key):
    """
    Sends a query to the Nutritionix API to get nutritional information for a food or meal.
    
    Parameters:
      - query (str): A description of the food (e.g., "Grilled Chicken Salad")
      - app_id (str): Your Nutritionix App ID.
      - app_key (str): Your Nutritionix App Key.
    
    Returns:
      A dictionary with the following keys:
        - calories: total calories plus 200 extra calories (for extraneous variables)
        - protein: total protein in grams
        - total_carbohydrate: total carbohydrate in grams
        - total_fat: total fat in grams
        
      If the request fails, returns None.
    """
    url = "https://trackapi.nutritionix.com/v2/natural/nutrients"
    headers = {
        "Content-Type": "application/json",
        "x-app-id": app_id,
        "x-app-key": app_key,
    }
    data = {"query": query}
    
    try:
        response = requests.post(url, json=data, headers=headers)
    except Exception as e:
        print(f"Request failed for query '{query}': {e}")
        return None

    if response.status_code == 200:
        result = response.json()
        foods = result.get("foods", [])
        
        total_calories = 0.0
        total_protein = 0.0
        total_carbs = 0.0
        total_fat = 0.0
        
        for food in foods:
            total_calories += food.get("nf_calories", 0)
            total_protein += food.get("nf_protein", 0)
            total_carbs += food.get("nf_total_carbohydrate", 0)
            total_fat += food.get("nf_total_fat", 0)
        
        # Add 200 extra calories for extraneous variables.
        total_calories += 200
        
        return {
            "calories": total_calories,
            "protein": total_protein,
            "total_carbohydrate": total_carbs,
            "total_fat": total_fat
        }
    else:
        print(f"Error {response.status_code} for query '{query}': {response.text}")
        return None

#############################
# Health Score Computation
#############################
def compute_meal_health(row):
    """
    Computes a meal health score using nutrient data from a row.
    Each component is normalized and capped between 0 and 1.
    
    Components:
      - Normalized calories: (MAX_CALORIES - calories) / MAX_CALORIES
      - Normalized protein: protein / REFERENCE_PROTEIN
      - Normalized carbohydrate: 1 - (total_carbohydrate / REFERENCE_CARBS)
      - Normalized fat: 1 - (total_fat / REFERENCE_FAT)
    
    The overall meal health score is the average of these four components.
    """
    norm_calories = (MAX_CALORIES - row["calories"]) / MAX_CALORIES
    norm_calories = max(0, min(norm_calories, 1))
    
    norm_protein = row["protein"] / REFERENCE_PROTEIN
    norm_protein = max(0, min(norm_protein, 1))
    
    norm_carbs = 1 - (row["total_carbohydrate"] / REFERENCE_CARBS)
    norm_carbs = max(0, min(norm_carbs, 1))
    
    norm_fat = 1 - (row["total_fat"] / REFERENCE_FAT)
    norm_fat = max(0, min(norm_fat, 1))
    
    meal_health = (norm_calories + norm_protein + norm_carbs + norm_fat) / 4.0
    return meal_health

#############################
# Main Function
#############################
def main():
    input_csv = INPUT_CSV
    output_csv = OUTPUT_CSV
    
    # Load the meals dataset.
    try:
        df = pd.read_csv(input_csv)
    except Exception as e:
        print(f"Error loading CSV file '{input_csv}': {e}")
        return
    
    # Check that required columns exist.
    required_columns = ["dining_hall", "meal_name"]
    for col in required_columns:
        if col not in df.columns:
            print(f"CSV file is missing required column: {col}")
            return

    # Prepare lists to hold nutrient values.
    calorie_values = []
    protein_values = []
    carbs_values = []
    fat_values = []
    
    print("Querying Nutritionix API for each meal...")
    for index, row in df.iterrows():
        meal_name = row["meal_name"]
        query = meal_name  # You can add more context to the query if desired.
        nutrients = get_nutrients_from_nutritionix(query, APP_ID, APP_KEY)
        if nutrients is None:
            nutrients = {"calories": 0, "protein": 0, "total_carbohydrate": 0, "total_fat": 0}
        calorie_values.append(nutrients["calories"])
        protein_values.append(nutrients["protein"])
        carbs_values.append(nutrients["total_carbohydrate"])
        fat_values.append(nutrients["total_fat"])
        print(f"Meal: {meal_name} -> Calories: {nutrients['calories']}, Protein: {nutrients['protein']}g, Carbs: {nutrients['total_carbohydrate']}g, Fat: {nutrients['total_fat']}g")
        time.sleep(1)  # Pause 1 second to avoid hitting API rate limits.
    
    # Add nutrient data as new columns.
    df["calories"] = calorie_values
    df["protein"] = protein_values
    df["total_carbohydrate"] = carbs_values
    df["total_fat"] = fat_values
    
    # Compute the meal health score for each meal.
    df["meal_health"] = df.apply(compute_meal_health, axis=1)
    
    # Save the updated meal data to a new CSV file.
    df.to_csv(output_csv, index=False)
    print(f"\nUpdated meal data with nutrient and health information has been written to '{output_csv}'")
    
    # Compute average nutrients and average meal health by dining hall.
    avg_nutrients = df.groupby("dining_hall").agg({
        "calories": "mean",
        "protein": "mean",
        "total_carbohydrate": "mean",
        "total_fat": "mean",
        "meal_health": "mean"
    }).reset_index()
    
    avg_nutrients = avg_nutrients.round(2)
    print("\nAverage Nutrients and Health Score by Dining Hall:")
    print(avg_nutrients)
    
    # Save the dining hall averages to a new CSV file.
    avg_nutrients.to_csv("dining_hall_averages.csv", index=False)
    print("\nDining hall averages have been written to 'dining_hall_averages.csv'")

if __name__ == "__main__":
    main()
