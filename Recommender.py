import pandas as pd
import os
from datetime import datetime

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
    
    if preference == "healthy":
        base_score = 0.5 * row["meal_health"] + 0.3 * norm_calories + 0.2 * row["food_variety"]
    elif preference == "variety":
        base_score = 0.3 * row["meal_health"] + 0.2 * norm_calories + 0.5 * row["food_variety"]
    else:  # balanced
        base_score = 0.4 * row["meal_health"] + 0.3 * norm_calories + 0.3 * row["food_variety"]
    7
    recent_penalty = row.get("recent_penalty", 1)
    return base_score * recent_penalty

def recommend_dining_hall(dining_df, preference="healthy", top_k=1):
    """
    Computes a combined score for each dining hall and returns the top_k halls sorted by score.
    """
    df = dining_df.copy()
    df["score"] = df.apply(lambda row: score_dining_hall(row, preference), axis=1)
    df = df.sort_values(by="score", ascending=False)
    return df.head(top_k)

#############################
# Main Function
#############################
def main():
    # Update the dining halls CSV using the visits data.
    updated_df = update_dining_halls(DINING_HALLS_CSV, DINING_VISITS_CSV, UPDATED_CSV)
    
    # Display available dining halls.
    print("\nAvailable Dining Halls:")
    try:
        print(updated_df[["dining_hall"]])
    except KeyError:
        print("The CSV file does not have the expected columns.")
        return
    
    # Ask the user for their dining preference.
    print("\nEnter your dining preference:")
    print("  - healthy: prioritize healthy food (high meal_health and low calories)")
    print("  - variety: prioritize a wide selection of food")
    print("  - balanced: a mix of both")
    preference = input("Your preference (healthy/variety/balanced): ").strip().lower()
    if preference not in ["healthy", "variety", "balanced"]:
        print("Invalid input. Using 'balanced' as default.")
        preference = "balanced"
    
    # Get the top recommended dining hall(s).
    top_k = 1  # Change as desired.
    recommended = recommend_dining_hall(updated_df, preference, top_k)
    
    print("\nRecommended Dining Hall(s):")
    for _, row in recommended.iterrows():
        print(f"Dining Hall: {row['dining_hall']}")
        print(f"Average Calories: {row['calories']}")
        print(f"Meal Health: {row['meal_health']}")
        print(f"Food Variety: {row['food_variety']:.2f}")
        print(f"Recent Penalty: {row['recent_penalty']}")
        print(f"Combined Score: {row['score']:.2f}")
        print("-" * 40)

if __name__ == "__main__":
    main()


#Nutritionix API used.