import React, { useState, useEffect } from "react";
import { View, Text, Image, StyleSheet, ImageBackground, TouchableOpacity, Dimensions, ScrollView, useWindowDimensions } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

function checkChefMikesHours() {
  const now = new Date();
  const time = now.getHours() * 100 + now.getMinutes();
  // Chef Mike's hours: 11:00 AM - 8:00 PM
  return time >= 1100 && time <= 2000;
}

export default function menu() {
  const navigation = useNavigation();
  const [menuItems, setMenuItems] = useState({});
  const [menuLoading, setMenuLoading] = useState(true);
  const [occupancyData, setOccupancyData] = useState(() => {
    const cached = localStorage.getItem('chefmikes_occupancy');
    return cached ? JSON.parse(cached) : { use: 0, capacity: 120 };
  });
  const [isOpen, setIsOpen] = useState(checkChefMikesHours());
  const timing = "11:00 AM - 8:00 PM";

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
          .eq('diningHall', "Chef Mike's")
          .order('foodType');

        if (menuError) {
          console.error('Error fetching menu:', menuError);
          return;
        }

        // Get nutrition data from cache
        const { data: nutritionData, error: nutritionError } = await supabase
          .from('nutrition_cache')
          .select('*')
          .eq('dining_hall', "Chef Mike's");

        if (nutritionError) {
          console.error('Error fetching nutrition:', nutritionError);
        }

        // Organize menu items by food type
        const organizedMenu = menuData.reduce((acc, item) => {
          // Create food type section if it doesn't exist
          if (!acc[item.foodType]) {
            acc[item.foodType] = [];
          }

          // Find nutrition data for this item
          const nutrition = nutritionData?.find(n => n.meal_name === item.foodName);

          // Add item with its nutrition data
          acc[item.foodType].push({
            ...item,
            dietaryPreferences: typeof item.dietaryPreferences === 'string' 
              ? item.dietaryPreferences 
              : JSON.stringify(item.dietaryPreferences),
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

  // Check open status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setIsOpen(checkChefMikesHours());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Menu rendering function
  const renderMenu = () => {
    if (menuLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      );
    }

    return Object.entries(menuItems).map(([foodType, items]) => (
      <View key={foodType} style={styles.foodTypeSection}>
        <View style={styles.foodTypeTitleContainer}>
          <Text style={styles.foodTypeTitle}>{foodType}</Text>
        </View>
        
        {items.map((item, index) => (
          <View key={index} style={styles.menuItem}>
            <View style={styles.menuItemContent}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemName}>{item.foodName}</Text>
                <View style={styles.menuItemDetails}>
                  {item.nutrition?.calories && (
                    <Text style={styles.calories}>{item.nutrition.calories} calories</Text>
                  )}
                  {item.contains && 
                   item.contains.replace(/[{}"\[\]]/g, '').split(',').filter(c => c && c.trim().length > 0).length > 0 && (
                    <Text style={styles.allergens}>
                      Contains: {
                        item.contains
                          .replace(/[{}"\[\]]/g, '')
                          .split(',')
                          .filter(c => c && c.trim().length > 0)
                          .map(c => c.trim())
                          .join(', ')
                      }
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.dietaryIconsContainer}>
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
          </View>
        ))}
      </View>
    ));
  };

  return (
    <View style={styles.body}>
      <View style={styles.container}>
        <ScrollView>
          <View style={styles.header}>
            <ImageBackground source={require("../assets/images/chefmikes.jpg")} resizeMode="cover" style={styles.imageBackground}>
              <View style={styles.overlay} />
              <TouchableOpacity style={styles.imgback} onPress={() => navigation.goBack()}>
                <Image style={styles.imgback} source={require("../assets/images/backsymb.png")} />
              </TouchableOpacity>              
              <View style={styles.topheader}>
                <View style={styles.openable}>
                  <Text style={styles.openabletext}>{isOpen ? "OPEN" : "CLOSED"}</Text>
                </View>
                <Text style={styles.title}>Chef Mike's</Text>
              </View>
              <View style={styles.bottomheader}>
                <Text style={styles.subtitle}>{timing}</Text>
              </View>
            </ImageBackground>
          </View>

          <View style={styles.menuContainer}>
            {renderMenu()}
          </View>
        </ScrollView>
      </View>
    </View>
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
  foodTypeTitleContainer: {
    marginBottom: 10,
  },
  foodTypeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#423934",
  },
  menuItemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuItemLeft: {
    flexDirection: "column",
  },
  menuItemDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  calories: {
    fontSize: 14,
    color: "#8D7861",
  },
  allergens: {
    fontSize: 14,
    color: "#8D7861",
  },
  dietaryIconsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});
