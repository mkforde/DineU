import React, { useState, useEffect } from "react";
import { View, Text, Image, StyleSheet, ImageBackground, TouchableOpacity, Dimensions, ScrollView, useWindowDimensions, SafeAreaView } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Add this function before the component
function checkJJsHours() {
  const now = new Date();
  const time = now.getHours() * 100 + now.getMinutes();
  
  // JJ's hours: 12:00 PM - 10:00 AM next day
  // Return true if time is between 12:00 PM (1200) and 11:59 PM (2359)
  // OR between 12:00 AM (0) and 10:00 AM (1000)
  return time >= 1200 || time <= 1000;
}

export default function menu() {
  const navigation = useNavigation(); // Initialize navigation
  const [menuItems, setMenuItems] = useState({});
  const [menuLoading, setMenuLoading] = useState(true);
  const [occupancyData, setOccupancyData] = useState({ use: 0, capacity: 198 });
  const [isOpen, setIsOpen] = useState(checkJJsHours());
  const timing = "12:00 PM - 10:00 AM";

  // Diet/Allergen Icons
  const dietIcons = {
    'Vegan': require('../assets/images/Vegan.png'),
    'Vegetarian': require('../assets/images/Vegan.png'),
    'Halal': require('../assets/images/Halal.png'),
    'Gluten Free': require('../assets/images/Gluten_Free.png')
  };

  // Fetch menu and nutrition data from cache
  useEffect(() => {
    async function fetchMenuData() {
      try {
        setMenuLoading(true);
        
        // Get menu items from cache
        const { data: menuData, error: menuError } = await supabase
          .from('menu_cache')
          .select('*')
          .eq('diningHall', "JJ's")
          .order('foodType');

        if (menuError) {
          console.error('Error fetching menu:', menuError);
          return;
        }

        // Get nutrition data from cache
        const { data: nutritionData, error: nutritionError } = await supabase
          .from('nutrition_cache')
          .select('*')
          .eq('dining_hall', "JJ's");

        if (nutritionError) {
          console.error('Error fetching nutrition:', nutritionError);
        }

        // Organize menu items by meal type and food type
        const organizedMenu = menuData.reduce((acc, item) => {
          // Create meal type section if it doesn't exist
          if (!acc[item.mealType]) {
            acc[item.mealType] = {};
          }
          
          // Create food type section if it doesn't exist
          if (!acc[item.mealType][item.foodType]) {
            acc[item.mealType][item.foodType] = [];
          }

          // Find nutrition data for this item
          const nutrition = nutritionData?.find(n => n.meal_name === item.foodName);

          // Add item with its nutrition data
          acc[item.mealType][item.foodType].push({
            ...item,
            // Ensure dietaryPreferences is a string
            dietaryPreferences: typeof item.dietaryPreferences === 'string' 
              ? item.dietaryPreferences 
              : JSON.stringify(item.dietaryPreferences),
            // Ensure contains is a string
            contains: typeof item.contains === 'string'
              ? item.contains
              : JSON.stringify(item.contains),
            nutrition: nutrition?.nutrition_data || {}
          });

          return acc;
        }, {});

        setMenuItems(organizedMenu);
        setMenuLoading(false);
      } catch (error) {
        console.error('Error loading menu data:', error);
        setMenuLoading(false);
      }
    }

    fetchMenuData();
  }, []);

  // Add this useEffect after other useEffects
  useEffect(() => {
    // Check open status every minute
    const interval = setInterval(() => {
      setIsOpen(checkJJsHours());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Add useEffect to load stored data
  useEffect(() => {
    async function loadStoredData() {
      try {
        const cached = await AsyncStorage.getItem('jjs_occupancy');
        if (cached) {
          setOccupancyData(JSON.parse(cached));
        }
      } catch (error) {
        console.error('Error loading stored data:', error);
      }
    }
    loadStoredData();
  }, []);

  const reviews = [
    { name: "Alice", rating: 5, comment: "Delicious! Highly recommend." },
    { name: "John", rating: 4, comment: "Tasty but a bit salty." },
    { name: "Emma", rating: 3, comment: "Average, not the best I've had." },
    { name: "Mike", rating: 2, comment: "Not great, wouldn't order again." },
    { name: "Chris", rating: 1, comment: "Terrible. Avoid at all costs." },
  ];
  
  const renderStars = (rating) => {
    const totalStars = 5;
    let stars = [];
  
    for (let i = 0; i < totalStars; i++) {
      if (i < rating) {
        stars.push(
          <Image 
            key={i} 
            source={require("../assets/images/star_gold.png")} // Gold Star
            style={styles.starIcon} 
          />
        );
      } else {
        stars.push(
          <Image 
            key={i} 
            source={require("../assets/images/star_gray.png")} // Gray Star
            style={styles.starIcon} 
          />
        );
      }
    }
    return stars;
  };
  
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(null);
  const [items, setItems] = useState([
    { label: "Option 1", value: "option1" },
    { label: "Option 2", value: "option2" },
    { label: "Option 3", value: "option3" },
  ]);

  const clickedDining = "JJ's Place";
  const { height } = useWindowDimensions(); // Auto-updating height

  // Add getCurrentPeriod function
  const getCurrentPeriod = () => {
    const now = new Date();
    const time = now.getHours() * 100 + now.getMinutes();
    
    // JJ's hours: 12:00 PM - 10:00 AM
    if (time >= 1200 || time <= 1000) {
      if (time >= 2000 || time <= 1000) {
        return 'Late Night';
      }
      return 'Lunch/Dinner';
    }
    return null;
  };

  // Update menu rendering
  const renderMenu = () => {
    if (menuLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      );
    }

    // Combine all items across meal types and organize by food type
    const foodTypes = {};
    Object.values(menuItems).forEach(mealPeriod => {
      Object.entries(mealPeriod).forEach(([foodType, items]) => {
        if (!foodTypes[foodType]) {
          foodTypes[foodType] = [];
        }
        foodTypes[foodType].push(...items);
      });
    });

    return Object.entries(foodTypes).map(([foodType, items]) => (
      <View key={foodType} style={styles.foodTypeSection}>
        <Text style={styles.foodTypeTitle}>{foodType}</Text>
        
        {items.map((item, index) => (
          <View key={index} style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemName}>{item.foodName}</Text>
              {item.nutrition?.calories && (
                <Text style={styles.calories}>{item.nutrition.calories} cal</Text>
              )}
              {item.contains && 
               item.contains.replace(/[{}"\[\]]/g, '').split(',').filter(Boolean).length > 0 && (
                <Text style={styles.allergens}>
                  Contains: {item.contains.replace(/[{}]/g, '').split(',').filter(Boolean).join(', ')}
                </Text>
              )}
            </View>
            <View style={styles.dietaryIcons}>
              {item.dietaryPreferences && 
                (typeof item.dietaryPreferences === 'string' 
                  ? item.dietaryPreferences
                  : JSON.stringify(item.dietaryPreferences))
                  .replace(/[{}"\[\]]/g, '')
                  .split(',')
                  .filter(pref => pref && pref.trim().length > 0)
                  .map((diet, i) => {
                    const cleanDiet = diet.trim();
                    return dietIcons[cleanDiet] && (
                      <Image 
                        key={i} 
                        source={dietIcons[cleanDiet]} 
                        style={styles.dietaryIcon} 
                      />
                    );
                  })
              }
            </View>
          </View>
        ))}
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.body}>
          <View style={styles.container}>
            <ScrollView> 
              <View style={styles.header}>
                  <ImageBackground source={require("../assets/images/jjs.jpg")} resizeMode="cover" style={styles.imageBackground}>
                    <View style={styles.overlay} />
                    <TouchableOpacity style={styles.imgback} onPress={() => navigation.goBack()}>
                      <Image style={styles.imgback} source={require("../assets/images/backsymb.png")} />
                    </TouchableOpacity>              
                    <View style={styles.topheader}>
                      <View style={styles.openable}>
                        <Text style={styles.openabletext}>{isOpen ? 'OPEN' : 'CLOSED'}</Text>
                      </View>
                      <Text style={styles.title}>{clickedDining}</Text>
                    </View>
                    <View style={styles.bottomheader}>
                      <Text style={styles.subtitle}>{timing}</Text>
                    </View>
                  </ImageBackground>
              </View>

              {isOpen === "CLOSED" ? (
                <View style={styles.closedContainer}>
                  <Text style={styles.closedMessage}>
                    JJ's Place is currently closed.{'\n'}
                    Please check back during operating hours:{'\n'}
                    {timing}
                  </Text>
                </View>
              ) : (
                <View> 
                  <View style = {styles.stats}>
                    <View style = {styles.stat}>
                      <View style = {styles.nutri}>
                        <Text style = {styles.Stitle}>Nutri-score</Text>
                        <Image source={require("../assets/images/tooltip.png")} />
                      </View>
                      <View style = {styles.nutri}>
                        <Text style={styles.Stitle}>Current Seating Capacity</Text>
                        <Image source={require("../assets/images/tooltip.png")} />
                      </View>
                    </View>
                    <View style={styles.imageM}>
                      <Image source={require("../assets/images/NutriB.png")} />
                      <View style={styles.capacityContainer}>
                        <Text style={[styles.capacityText, { color: '#423934' }]}>
                          {occupancyData.use}/{occupancyData.capacity}
                        </Text>
                        <View style={styles.progressBarContainer}>
                          <View style={[
                            styles.progressBarFill, 
                            { 
                              width: `${(occupancyData.use / occupancyData.capacity) * 100}%`,
                              backgroundColor: occupancyData.use / occupancyData.capacity < 0.25 ? "#9AD94B" :
                                             occupancyData.use / occupancyData.capacity <= 0.5 ? "#FFC632" :
                                             occupancyData.use / occupancyData.capacity <= 0.75 ? "#E15C11" : 
                                             "#E11111"
                            }
                          ]} />
                        </View>
                      </View>
                    </View>
                  </View>

                  <View  style={styles.menuTitle}>
                    <Text style={styles.titleM}>Menu</Text>
                  </View>
                  {renderMenu()}
                  <View style={styles.reviewsContainer}>
                    <Text style={styles.sectionTitle}>Reviews</Text>
                    {reviews.map((review, index) => (
                      <View key={index} style={styles.reviewItem}>
                        <Text style={styles.reviewText}>
                          <Text style={styles.bold}>{review.name}</Text>: {review.comment}
                        </Text>
                        <View style={styles.starContainer}>{renderStars(review.rating)}</View>
                      </View>
                    ))}
                  </View>


                </View>
              )}
             

            </ScrollView>
            
         
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}



const styles = StyleSheet.create({
  imgback:{
    position: "absolute",
    left:0,
    top:0,
    height: 50,
    width: 50,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#423934",
    
  },
  menuContainer:{
    gap: 10,
    marginLeft: 20,

  },
  menuItemCalories: {
    fontSize: 14,
    color: "#8D7861",
  },
  dietaryIcons: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  dietaryIcon: {
    width: 20,
    height: 20,
    marginLeft: 5,
  },
  menuTitle:{
    marginLeft: 20,
    marginBottom: 20,
  },
  container:{
    flex: 1,
    backgroundColor: "#FDFECC", // Light yellow background
    alignContent: "center",
    width: 393,
  }, 
  
  topheader:{
    flexDirection: "row",
    alignItems:"center",
    gap: 10,
    marginLeft: 20,
    

  }, 
  Stitle:{
    fontSize: 13.56,
    fontWeight:500, 
  },
  bottomheader:{
    marginBottom: 20,
    marginLeft: 20,
  },
  diningButton:{
    flexDirection: "row",
  },
  stats:{
    alignItems: "space-evenly",
    marginTop: 20,
    gap:10,
    marginBottom: 40,


  },
  imageM:{
    justifyContent: "space-evenly",
    flexDirection: "row",
    alignItems:"center",
  },
  stat:{
    
    flexDirection: "row", 
    justifyContent: "space-evenly",

  },
  nutri:{
    flexDirection: "row",
    gap: 5,
  },
  header:{
    height:192,
    width: 394,
    justifyContent: "flex-end",
  

  },
  subtitle:{
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "500",

  },
  openable:{
    width:50.08,
    height: 25.04, 
    backgroundColor: "#EEF168",
    alignItems: "center", 
    borderRadius: 19.26,
    justifyContent: "center",

  },
  openabletext:{
    color: "rgba(66, 57, 52, 1)",
    fontSize: 12.52,
    borderRadius: 19.26,
    fontWeight: 600,

  },
  titleM:{
    fontSize: 33.38,
    fontWeight: 900,
    color: "rgba(, 57, 52, 1)",
  },
  title:{
    fontSize: 33.38,
    fontWeight: 900,
    color: "#FFF",
  },
  body:{
    width:"100%",
    alignItems: "center",
    flex: 1, // Full height of the screen
    fontFamily: "Helvetica",

  },
 bold:{
    fontWeight: "bold",
 }, 
 imageBackground: {
  width: "100%",
  height: "100%",
  justifyContent: "flex-end",
},
overlay: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
},

  progressBarContainer: {
    width: 97,
    height: 8,
    backgroundColor: "#ccc",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 5,
    marginLeft: "5%",

  },
  progressBarFill: {
    height: "100%",
  },
  
  buttonText: {
    fontSize: 17.55,
    color: "#FFFFFF", // Light yellow text
    fontWeight: "900",
    marginLeft: "5%",

   
  },
  capacityText: {
    color: "#FFFFFF",
    fontSize: 13.56,
    fontWeight: "900",

    
  },
  reviewsContainer: {
    backgroundColor: "#FDFECC",
    borderRadius: 15,
    padding: 15,
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  reviewItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 10,
    marginBottom: 10,
  },
  reviewText: {
    fontSize: 14,
    color: "#423934",
  },
  
  starContainer: {
    flexDirection: "row",
    marginTop: 5,
  },
  starIcon: {
    width: 18,
    height: 18,
    marginRight: 3,
  },
  capacityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#423934",
  },
  foodTypeSection: {
    marginBottom: 20,
  },
  foodTypeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#423934',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuItemLeft: {
    flex: 1,
  },
  allergens: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  mealSection: {
    marginBottom: 24,
  },
  mealTypeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#423934',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  calories: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  closedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 40,
  },
  closedMessage: {
    fontSize: 18,
    textAlign: 'center',
    color: '#423934',
    lineHeight: 28,
    fontWeight: '500',
  },
});