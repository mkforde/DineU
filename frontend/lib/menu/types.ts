export interface MenuItem {
  mealType: string;
  diningHall: string;
  hours: string;
  foodType: string;
  foodName: string;
  dietaryPreferences?: string[];  // Optional array of dietary preferences (Halal, Vegan, Vegetarian)
  contains?: string[];  // Optional array of allergens/ingredients
} 