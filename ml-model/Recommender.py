import pandas as pd
import os
from datetime import datetime
import sys
import json
import numpy as np
from typing import List, Dict

#############################
# Configuration
#############################
DINING_HALLS_CSV = "dining_hall_averages.csv"  # Input dining halls CSV with columns:
# dining_hall, calories, protein, total_carbohydrate, total_fat, meal_health
DINING_VISITS_CSV = "dining_visits.csv"          # CSV logging visits with columns: dining_hall, meal_name, visit_date
UPDATED_CSV = "dining_halls_updated.csv"         # Output CSV with updated food_variety and recent_penalty

MAX_CALORIES = 1500.0  # Used to normalize calories

# Parameters for computing food variety
VARIETY_THRESHOLD = 0.5   # If raw variety (unique meals / total visits) is below this, apply punishment.
PUNISHMENT_FACTOR = 0.8   # Multiply variety score by this factor if below threshold.

# Parameters for recency penalty
DAYS_THRESHOLD = 0        # If the most recent visit is less than 7 days ago, apply a penalty.
RECENCY_PENALTY = 0.8     # Multiply the base score by this factor if recently visited.

# Weights for different factors in recommendation
WEIGHTS = {
    'meal_health': 0.4,      # Overall health score
    'protein': 0.2,          # Protein content
    'variety': 0.2,          # Menu variety
    'calories': 0.2          # Calorie balance
}

# Target values for optimal nutrition
TARGETS = {
    'calories_per_meal': 600,    # Target calories per meal
    'protein_per_meal': 25,      # Target protein grams per meal
    'min_menu_items': 5          # Minimum items for good variety
}

#############################
# Data Loading and Update Functions
#############################
def load_dining_halls(csv_file):
    """
    Load dining hall data from a CSV file.
    Expected columns: dining_hall, calories, protein, total_carbohydrate, total_fat, meal_health.
    If the file does not exist, a sample dataset is created.
    """
    if not os.path.exists(csv_file):
        # Create a sample dataset if none exists.
        data = {
            "dining_hall": ["Dining Hall A", "Dining Hall B", "Dining Hall C", "Dining Hall D"],
            "calories": [450, 600, 350, 500],
            "protein": [30, 25, 20, 18],
            "total_carbohydrate": [15, 50, 60, 40],
            "total_fat": [10, 35, 15, 12],
            "meal_health": [0.85, 0.70, 0.90, 0.80]
        }
        df = pd.DataFrame(data)
        df.to_csv(csv_file, index=False)
        print(f"Sample dining halls CSV created at '{csv_file}'")
    else:
        df = pd.read_csv(csv_file)
    # Ensure the dining hall identifier is a string.
    df["dining_hall"] = df["dining_hall"].astype(str)
    return df

def compute_food_variety(visits_csv):
    """
    Reads the dining visits CSV and computes a food variety score for each dining hall.
    Food variety = (number of unique meals) / (total number of visits).
    If below VARIETY_THRESHOLD, multiply by PUNISHMENT_FACTOR.
    
    Returns a DataFrame with columns: dining_hall, food_variety.
    """
    df_visits = pd.read_csv(visits_csv)
    df_visits["dining_hall"] = df_visits["dining_hall"].astype(str)
    
    variety_df = df_visits.groupby("dining_hall").agg(
        total_visits=("meal_name", "count"),
        unique_meals=("meal_name", lambda x: x.nunique())
    ).reset_index()
    
    variety_df["food_variety"] = variety_df["unique_meals"] / variety_df["total_visits"]
    variety_df["food_variety"] = variety_df["food_variety"].apply(
        lambda x: x * PUNISHMENT_FACTOR if x < VARIETY_THRESHOLD else x
    )
    return variety_df[["dining_hall", "food_variety"]]

def compute_recency_penalty(visits_csv, days_threshold=DAYS_THRESHOLD, penalty=RECENCY_PENALTY):
    """
    Reads the dining visits CSV and computes a recency penalty for each dining hall.
    For each dining hall, if the most recent visit was less than days_threshold days ago,
    the penalty is applied; otherwise, the penalty is 1.
    
    Returns a DataFrame with columns: dining_hall, recent_penalty.
    """
    df_visits = pd.read_csv(visits_csv)
    df_visits["dining_hall"] = df_visits["dining_hall"].astype(str)
    # Convert visit_date to datetime.
    df_visits["visit_date"] = pd.to_datetime(df_visits["visit_date"])
    # Get the most recent visit for each dining hall.
    recency_df = df_visits.groupby("dining_hall")["visit_date"].max().reset_index()
    # Compute days since most recent visit.
    today = pd.to_datetime(datetime.now().date())
    recency_df["days_since"] = (today - recency_df["visit_date"]).dt.days
    # Apply penalty: if days_since < days_threshold, penalty; otherwise, 1.0.
    recency_df["recent_penalty"] = recency_df["days_since"].apply(
        lambda d: penalty if d < days_threshold else 1.0
    )
    return recency_df[["dining_hall", "recent_penalty"]]

def update_dining_halls(dining_csv, visits_csv, output_csv):
    """
    Updates the dining halls CSV with computed food variety and recency penalty from the visits CSV.
    If a dining hall has no visit data, food_variety and recent_penalty default to 1.
    """
    df_dining = load_dining_halls(dining_csv)
    if os.path.exists(visits_csv):
        variety_df = compute_food_variety(visits_csv)
        recency_df = compute_recency_penalty(visits_csv)
        # Merge computed metrics on "dining_hall".
        df_updated = pd.merge(df_dining, variety_df, on="dining_hall", how="left")
        df_updated = pd.merge(df_updated, recency_df, on="dining_hall", how="left")
        df_updated["food_variety"] = df_updated["food_variety"].fillna(1)
        df_updated["recent_penalty"] = df_updated["recent_penalty"].fillna(1)
        df_updated.to_csv(output_csv, index=False)
        print(f"Updated dining hall data with food variety and recency penalty written to '{output_csv}'")
        print(df_updated[["dining_hall", "food_variety", "recent_penalty"]])
        return df_updated
    else:
        print(f"Dining visits CSV '{visits_csv}' not found. Using original dining hall data.")
        return df_dining

#############################
# Scoring and Recommendation Functions
#############################
def score_dining_hall(row, preference):
    """
    Computes a combined score for a dining hall based on:
      - Normalized calories (lower is better)
      - Meal health (proxy for overall nutritional quality; higher is better)
      - Food variety (higher is better)
    The base score is weighted based on user preference.
    Then the base score is multiplied by the recent_penalty to penalize dining halls that
    have been visited very recently.
    """
    # Normalize calories: lower calories yield higher normalized value.
    norm_calories = (MAX_CALORIES - row["calories"]) / MAX_CALORIES
    
    base_score = 0.3 * row["meal_health"] + 0.2 * norm_calories + 0.5 * row.get("food_variety", 1.0)
    recent_penalty = row.get("recent_penalty", 1.0)
    return base_score * recent_penalty

def recommend_dining_hall(dining_df: pd.DataFrame) -> List[Dict]:
    """
    Generate dining hall recommendations with insights
    """
    # Compute scores for each dining hall
    scores = compute_dining_scores(dining_df)
    
    # Log raw scores before sorting
    print("\nRaw dining hall scores:", file=sys.stderr)
    print("------------------------", file=sys.stderr)
    for _, row in scores.iterrows():
        print(f"{row['dining_hall']}:", file=sys.stderr)
        print(f"  Health: {row['health_score']:.3f}", file=sys.stderr)
        print(f"  Protein: {row['protein_score']:.3f}", file=sys.stderr)
        print(f"  Variety: {row['variety_score']:.3f}", file=sys.stderr)
        print(f"  Calorie Balance: {row['calorie_score']:.3f}", file=sys.stderr)
        print(f"  Final Score: {row['final_score']:.3f}", file=sys.stderr)
    sys.stderr.flush()
    
    # Sort by final score
    ranked_halls = scores.sort_values('final_score', ascending=False)
    
    # Log ranking order
    print("\nFinal Rankings:", file=sys.stderr)
    print("---------------", file=sys.stderr)
    for i, (_, row) in enumerate(ranked_halls.iterrows(), 1):
        print(f"{i}. {row['dining_hall']} (Score: {row['final_score']:.3f})", file=sys.stderr)
    sys.stderr.flush()
    
    # Generate insights for each dining hall
    results = []
    for _, row in ranked_halls.iterrows():
        dining_hall = row['dining_hall']
        
        # Replace NaN with 0 for all scores
        final_score = float(row['final_score']) if not pd.isna(row['final_score']) else 0.0
        health_score = float(row['health_score']) if not pd.isna(row['health_score']) else 0.0
        protein_score = float(row['protein_score']) if not pd.isna(row['protein_score']) else 0.0
        variety_score = float(row['variety_score']) if not pd.isna(row['variety_score']) else 0.0
        calorie_score = float(row['calorie_score']) if not pd.isna(row['calorie_score']) else 0.0
        
        result = {
            'dining_hall': dining_hall,
            'score': round(final_score, 3),
            'scores': {
                'health': round(health_score, 3),
                'protein': round(protein_score, 3),
                'variety': round(variety_score, 3),
                'calorie_balance': round(calorie_score, 3)
            },
            'insights': get_dining_insights(dining_hall, dining_df)
        }
        results.append(result)
    
    return results

def compute_dining_scores(dining_df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute recommendation scores for each dining hall
    """
    scores = pd.DataFrame()
    scores['dining_hall'] = dining_df['dining_hall'].unique()
    
    # Calculate health score (already normalized)
    scores['health_score'] = dining_df.groupby('dining_hall')['meal_health'].mean().fillna(0)
    
    # Calculate protein score (normalize based on target)
    protein_means = dining_df.groupby('dining_hall')['protein'].mean()
    scores['protein_score'] = (protein_means / TARGETS['protein_per_meal']).fillna(0)
    scores['protein_score'] = scores['protein_score'].clip(0, 1)  # Normalize to 0-1
    
    # Calculate variety score
    menu_counts = dining_df.groupby('dining_hall').size()
    scores['variety_score'] = (menu_counts / TARGETS['min_menu_items']).fillna(0)
    scores['variety_score'] = scores['variety_score'].clip(0, 1)  # Normalize to 0-1
    
    # Calculate calorie balance score
    calorie_means = dining_df.groupby('dining_hall')['calories'].mean()
    calorie_diff = abs(calorie_means - TARGETS['calories_per_meal'])
    scores['calorie_score'] = (1 - (calorie_diff / TARGETS['calories_per_meal'])).fillna(0)
    scores['calorie_score'] = scores['calorie_score'].clip(0, 1)  # Normalize to 0-1
    
    # Compute weighted final score
    scores['final_score'] = (
        WEIGHTS['meal_health'] * scores['health_score'] +
        WEIGHTS['protein'] * scores['protein_score'] +
        WEIGHTS['variety'] * scores['variety_score'] +
        WEIGHTS['calories'] * scores['calorie_score']
    ).fillna(0)  # Fill NaN with 0
    
    return scores

def get_dining_insights(dining_hall: str, dining_df: pd.DataFrame) -> Dict:
    """
    Generate insights for a specific dining hall
    """
    hall_data = dining_df[dining_df['dining_hall'] == dining_hall]
    
    # Calculate average macros
    avg_macros = {
        'calories': round(hall_data['calories'].mean(), 1),
        'protein': round(hall_data['protein'].mean(), 1),
        'carbs': round(hall_data['total_carbohydrate'].mean(), 1),
        'fat': round(hall_data['total_fat'].mean(), 1)
    }
    
    return {
        'dining_hall': dining_hall,
        'menu_size': len(hall_data),
        'avg_health_score': round(hall_data['meal_health'].mean(), 3),
        'avg_macros': avg_macros
    }

#############################
# Main Function
#############################
if __name__ == "__main__":
    try:
        print("Recommender.py starting...", file=sys.stderr)
        sys.stderr.flush()
        
        # Read and parse input data
        input_data = sys.stdin.read()
        parsed_data = json.loads(input_data)
        dining_df = pd.DataFrame(parsed_data)
        
        print("\nGenerating recommendations for dining halls:", file=sys.stderr)
        for hall in dining_df['dining_hall'].unique():
            print(f"- {hall}", file=sys.stderr)
        sys.stderr.flush()
        
        # Generate recommendations
        recommendations = recommend_dining_hall(dining_df)
        
        # Log recommendations before sending
        print("\nTop dining hall recommendations:", file=sys.stderr)
        for i, rec in enumerate(recommendations, 1):
            print(f"\n{i}. {rec['dining_hall']}", file=sys.stderr)
            print(f"   Overall Score: {rec['score']}", file=sys.stderr)
            print(f"   Health Score: {rec['scores']['health']}", file=sys.stderr)
            print(f"   Protein Score: {rec['scores']['protein']}", file=sys.stderr)
            print(f"   Variety Score: {rec['scores']['variety']}", file=sys.stderr)
            print(f"   Calorie Balance: {rec['scores']['calorie_balance']}", file=sys.stderr)
            print(f"   Menu Size: {rec['insights']['menu_size']}", file=sys.stderr)
            print(f"   Avg Health Score: {rec['insights']['avg_health_score']}", file=sys.stderr)
            print(f"   Avg Calories: {rec['insights']['avg_macros']['calories']}", file=sys.stderr)
        sys.stderr.flush()
        
        # Output recommendations as JSON
        sys.stdout.write(json.dumps(recommendations))
        sys.stdout.flush()
        
        print("\nRecommender.py finished successfully", file=sys.stderr)
        sys.stderr.flush()
        sys.exit(0)
    except Exception as e:
        print(f"Error in Recommender.py: {str(e)}", file=sys.stderr)
        print(traceback.format_exc(), file=sys.stderr)
        sys.stderr.flush()
        sys.exit(1)


#Nutritionix API used.