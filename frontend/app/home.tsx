import React, { useEffect, useRef } from "react";
import { useState } from 'react';
import { View, Text, Image, StyleSheet, ImageBackground, TouchableOpacity, Dimensions, ScrollView, useWindowDimensions} from "react-native";
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from "@react-native-async-storage/async-storage";

interface DiningButtonProps {
  title: string;
  image: any;  // or more specific type if needed
  use: number;
  capacity: number;
}

type LocationKey = 'chefMikes' | 'johnJay' | 'jjs' | 'ferris';

interface OccupancyData {
  use: number | null;
  capacity: number;
}

interface OccupancyCache {
  data: OccupancyData | null;
  lastFetched: number;
}

interface OccupancyCacheRef {
  chefMikes: OccupancyCache;
  johnJay: OccupancyCache;
  jjs: OccupancyCache;
  ferris: OccupancyCache;
}

function CustomBottomNav() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const navigation = useNavigation(); // Access navigation object
  
  return (
    <View style = {styles.bottom}>
      <TouchableOpacity onPress={() => { setActiveTab("home"); navigation.navigate("home"); }}>
      <Image
          source={require("../assets/images/home.png")}
          style={[activeTab === "home" && styles.activeIcon]}
        />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => { setActiveTab("table"); navigation.navigate("table"); }}>
        <Image
          source={require("../assets/images/Table.png")}
          style={[activeTab === "home" && styles.activeIcon]}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => { setActiveTab("location"); navigation.navigate("location"); }}>
        <Image
          source={require("../assets/images/location.png")}
          style={[ activeTab === "location" && styles.activeIcon]}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { setActiveTab("profile"); navigation.navigate("profile"); }}>
        <Image
          source={require("../assets/images/profile.png")}
          style={[ activeTab === "profile" && styles.activeIcon]}
        />
      </TouchableOpacity>
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState(() => {
    // Initialize name synchronously if possible
    const session = supabase.auth.session;
    if (session?.user?.id) {
      supabase
        .from('profiles')
        .select('firstName')
        .eq('id', session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.firstName) setUserName(data.firstName);
        });
    }
    return ''; // Initial empty state
  });
  const dataFetched = useRef(false);
  const [recommendedDining, setRecommendedDining] = useState('');
  const { height } = useWindowDimensions();
  const [jjsData, setJjsData] = useState<OccupancyData>({ use: null, capacity: 198 });
  const [johnJayData, setJohnJayData] = useState<OccupancyData>({ use: null, capacity: 400 });
  const [chefMikesData, setChefMikesData] = useState<OccupancyData>({ use: null, capacity: 171 });
  const [ferrisData, setFerrisData] = useState<OccupancyData>({ use: null, capacity: 363 });

  // Update the cache ref typing
  const occupancyCache = useRef<OccupancyCacheRef>({
    chefMikes: { data: null, lastFetched: 0 },
    johnJay: { data: null, lastFetched: 0 },
    jjs: { data: null, lastFetched: 0 },
    ferris: { data: null, lastFetched: 0 }
  });

  // Load initial data from AsyncStorage
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const [jjs, johnJay, chefMikes, ferris] = await Promise.all([
          AsyncStorage.getItem('jjs_occupancy'),
          AsyncStorage.getItem('johnjay_occupancy'),
          AsyncStorage.getItem('chefmikes_occupancy'),
          AsyncStorage.getItem('ferris_occupancy'),
        ]);

        if (jjs) setJjsData(JSON.parse(jjs));
        if (johnJay) setJohnJayData(JSON.parse(johnJay));
        if (chefMikes) setChefMikesData(JSON.parse(chefMikes));
        if (ferris) setFerrisData(JSON.parse(ferris));
      } catch (error) {
        console.error('Error loading stored data:', error);
      }
    };

    loadStoredData();
  }, []);

  // Update fetchOccupancyWithCache to use AsyncStorage instead of localStorage
  const fetchOccupancyWithCache = async (
    id: number, 
    capacity: number, 
    setData: React.Dispatch<React.SetStateAction<OccupancyData>>, 
    location: LocationKey
  ) => {
    const now = Date.now();
    const cache = occupancyCache.current[location];

    // Immediately show cached data if available
    if (cache.data) {
      setData(cache.data);
    }

    // Only fetch new data if cache is older than 30 seconds
    if (!cache.data || now - cache.lastFetched > 30000) {
      try {
        // Replace TAILSCALE_IP with your laptop's Tailscale IP address
        const response = await fetch(`http://100.78.111.116:3000/api/occupancy/${id}`);
        const occupancyData = await response.json();
        
        if (occupancyData.success && occupancyData.data) {
          const percentage = occupancyData.data.percentageFull * 100;
          const currentOccupancy = Math.round((percentage * capacity) / 100);
          
          const newData = {
            use: currentOccupancy,
            capacity: capacity
          };

          // Update both memory cache and AsyncStorgae
          occupancyCache.current[location] = {
            data: newData,
            lastFetched: now
          };
          AsyncStorage.setItem(location, JSON.stringify(newData));

          if (!cache.data || cache.data.use !== newData.use) {
            setData(newData);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${location} occupancy:`, error);
        // Add fallback data in case of network error
        const fallbackData = {
          use: Math.floor(capacity * 0.3), // Set to 30% as fallback
          capacity: capacity
        };
        setData(fallbackData);
      }
    }
  };

  // Single useEffect for auth and profile management
  useEffect(() => {
    async function initializeUser() {
      if (dataFetched.current) return; // Only run once
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      // Check existing profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('firstName')
        .eq('id', session.user.id)
        .single();

      if (profile?.firstName) {
        setUserName(profile.firstName);
        dataFetched.current = true;
        return;
      }

      // If no profile or no firstName, create one
      try {
        const uni = session.user.email?.split('@')[0];
        const directoryResponse = await fetch(`http://100.78.111.116:3000/api/directory/user/${uni}`);
        const directoryData = await directoryResponse.json();

        if (directoryData.success) {
          const firstName = directoryData.data.firstName;
          setUserName(firstName);
          
          await supabase
            .from('profiles')
            .upsert({
              id: session.user.id,
              uni,
              email: session.user.email,
              firstName
            });
        }
        dataFetched.current = true;
      } catch (error) {
        console.error('Error setting up profile:', error);
      }
    }

    initializeUser();
  }, [router]);

  // Update useEffects to pass storage keys
  useEffect(() => {
    const fetchChefMikes = () => fetchOccupancyWithCache(1339, 171, setChefMikesData, 'chefMikes');
    fetchChefMikes();
    const interval = setInterval(fetchChefMikes, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchJohnJay = () => fetchOccupancyWithCache(840, 400, setJohnJayData, 'johnJay');
    fetchJohnJay();
    const interval = setInterval(fetchJohnJay, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchJJs = () => fetchOccupancyWithCache(839, 198, setJjsData, 'jjs');
    fetchJJs();
    const interval = setInterval(fetchJJs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchFerris = () => fetchOccupancyWithCache(835, 363, setFerrisData, 'ferris');
    fetchFerris();
    const interval = setInterval(fetchFerris, 30000);
    return () => clearInterval(interval);
  }, []);

  // Add Ferris hours check
  const checkFerrisHours = (title: string) => {
    if (title === "Ferris") {
      const now = new Date();
      const day = now.getDay();
      const time = now.getHours() * 100 + now.getMinutes();

      // Monday - Friday (7:30 AM - 8:00 PM)
      if (day >= 1 && day <= 5) {
        return time >= 730 && time <= 2000;
      }
      // Saturday (9:00 AM - 8:00 PM)
      if (day === 6) {
        return time >= 900 && time <= 2000;
      }
      // Sunday (10:00 AM - 2:00 PM, 4:00 PM - 8:00 PM)
      if (day === 0) {
        return (time >= 1000 && time <= 1400) || (time >= 1600 && time <= 2000);
      }
      return false;
    }
    return true;
  };

  // Add Faculty House hours check
  const checkFacultyHours = (title: string) => {
    if (title === "Faculty House") {
      const now = new Date();
      const day = now.getDay();
      const time = now.getHours() * 100 + now.getMinutes();

      // Monday - Wednesday (11:00 AM - 2:30 PM)
      return (day >= 1 && day <= 3) && (time >= 1100 && time <= 1430);
    }
    return true;
  };

  const handleExplorePress = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
    } else {
      router.push('/explore');
    }
  };

  const DiningButton = ({ title, image, use, capacity }: DiningButtonProps) => {
    const navigation = useNavigation();
    const isFoodTruck = title === "Johnnys" || title === "Fac Shack";
    const isBarnard = title === "Dianas" || title === "Hewitt";
    const isChefDons = title === "Chef Dons";

    // Modify the checkChefHours function
    const checkChefHours = (location: string) => {
      const now = new Date();
      const day = now.getDay();
      const time = now.getHours() * 100 + now.getMinutes();

      if (location === "Chef Mikes") {
        // Monday-Friday (10:30 AM - 10:00 PM)
        return (day >= 1 && day <= 5) && (time >= 1030 && time <= 2200);
      }

      if (location === "Chef Dons") {
        // Monday-Friday (8:00 AM - 6:00 PM)
        return (day >= 1 && day <= 5) && (time >= 800 && time <= 1800);
      }
      return false;
    };

    // Temporary modification for testing open hours display
    const checkBarnardHours = (diningHall: string) => {
      const now = new Date();
      const day = now.getDay();
      const time = now.getHours() * 100 + now.getMinutes();
      
      if (diningHall === "Dianas") {
        if (day === 6) return false; // Closed on Saturday
        if (day === 0) return time >= 1200 && time <= 2000; // Sunday hours
        return time >= 900 && time <= 2359; // Weekday hours
      }
      
      if (diningHall === "Hewitt") {
        if (day === 0 || day === 6) { // Weekend hours
          return (time >= 1030 && time <= 1500) || (time >= 1630 && time <= 2000);
        }
        // Weekday hours
        return (time >= 730 && time <= 1000) || 
               (time >= 1100 && time <= 1430) || 
               (time >= 1630 && time <= 2000);
      }
      return false;
    };

    // Update the checkFoodTruckHours function
    const checkFoodTruckHours = (truckName: string) => {
      const now = new Date();
      const day = now.getDay();
      const time = now.getHours() * 100 + now.getMinutes();

      if (truckName === "Johnnys") {
        // Monday-Thursday lunch (11am-2pm)
        if (day >= 1 && day <= 4 && time >= 1100 && time <= 1400) {
          return true;
        }
        // Thursday-Saturday late night (7pm-11pm)
        if ((day >= 4 && day <= 6) && time >= 1900 && time <= 2300) {
          return true;
        }
        return false;
      }

      if (truckName === "Fac Shack") {
        // Monday-Thursday (11am-7pm)
        return (day >= 1 && day <= 4) && (time >= 1100 && time <= 1900);
      }
      return false;
    };

    // Add a function to check John Jay hours
    const checkJohnJayHours = (title: string) => {
      if (title === "John Jay") {
        const now = new Date();
        const day = now.getDay();
        const time = now.getHours() * 100 + now.getMinutes();

        // Sunday - Thursday (0-4): 9:30 AM - 9:00 PM
        if (day >= 0 && day <= 4) {
          return time >= 930 && time <= 2100;
        }
        return false;
      }
      return true; // For other dining halls
    };

    // Add JJ's hours check
    const checkJJsHours = (title: string) => {
      if (title === "JJs") {
        const now = new Date();
        const time = now.getHours() * 100 + now.getMinutes();
        
        // Open daily 12:00 PM - 10:00 AM next day
        return time >= 1200 || time <= 1000;
      }
      return true;
    };

    // Handle food trucks
    if (isFoodTruck) {
      const isOpen = checkFoodTruckHours(title);
      return (
        <TouchableOpacity style={styles.diningButton}>
          <ImageBackground source={image} resizeMode="cover" style={styles.imageBackground}>
            <View style={styles.overlay} />
            <Text style={styles.buttonText}>{title}</Text>
            {isOpen ? (
              <>
                <View style={styles.progressBarContainer}>
                  <View style={[
                    styles.progressBarFill, 
                    { 
                      width: '100%',
                      backgroundColor: "#9AD94B"
                    }
                  ]} />
                </View>
              </>
            ) : (
              <Text style={[styles.capacityText, { color: '#FFFFFF' }]}>Closed</Text>
            )}
          </ImageBackground>
        </TouchableOpacity>
      );
    }

    // Handle Barnard dining halls
    if (isBarnard) {
      const isOpen = checkBarnardHours(title);
      // Different mock capacity data for each Barnard location
      const mockData = isOpen ? {
        use: Math.floor(Math.random() * 40) + 20, // Random between 20-60
        capacity: title === "Dianas" ? 120 : 150 // Diana's: 120, Hewitt: 150
      } : { use: 0, capacity: 0 };

      return (
        <TouchableOpacity style={styles.diningButton}>
          <ImageBackground source={image} resizeMode="cover" style={styles.imageBackground}>
            <View style={styles.overlay} />
            <Text style={styles.buttonText}>{title}</Text>
            {isOpen ? (
              <>
                <Text style={styles.capacityText}>{mockData.use}/{mockData.capacity}</Text>
                <View style={styles.progressBarContainer}>
                  <View style={[
                    styles.progressBarFill, 
                    { 
                      width: `${(mockData.use / mockData.capacity) * 100}%`,
                      backgroundColor: "#9AD94B"
                    }
                  ]} />
                </View>
              </>
            ) : (
              <Text style={[styles.capacityText, { color: '#FFFFFF' }]}>Closed</Text>
            )}
          </ImageBackground>
        </TouchableOpacity>
      );
    }

    // Handle Chef's locations
    if (title === "Chef Mikes") {
      const isOpen = checkChefHours(title);
      return (
        <TouchableOpacity style={styles.diningButton}>
          <ImageBackground source={image} resizeMode="cover" style={styles.imageBackground}>
            <View style={styles.overlay} />
            <Text style={styles.buttonText}>{title}</Text>
            {isOpen ? (
              <>
                <Text style={styles.capacityText}>
                  {chefMikesData.use}/{chefMikesData.capacity}
                </Text>
                <View style={styles.progressBarContainer}>
                  <View style={[
                    styles.progressBarFill, 
                    { 
                      width: `${Math.max((chefMikesData.use / chefMikesData.capacity) * 100, 0)}%`,
                      backgroundColor: "#9AD94B"
                    }
                  ]} />
                </View>
              </>
            ) : (
              <Text style={[styles.capacityText, { color: '#FFFFFF' }]}>Closed</Text>
            )}
          </ImageBackground>
        </TouchableOpacity>
      );
    }

    if (title === "Chef Dons") {
      const isOpen = checkChefHours(title);
      return (
        <TouchableOpacity style={styles.diningButton}>
          <ImageBackground source={image} resizeMode="cover" style={styles.imageBackground}>
            <View style={styles.overlay} />
            <Text style={styles.buttonText}>{title}</Text>
            {isOpen ? (
              <View style={styles.progressBarContainer}>
                <View style={[
                  styles.progressBarFill, 
                  { 
                    width: '100%',
                    backgroundColor: "#9AD94B"
                  }
                ]} />
              </View>
            ) : (
              <Text style={[styles.capacityText, { color: '#FFFFFF' }]}>Closed</Text>
            )}
          </ImageBackground>
        </TouchableOpacity>
      );
    }

    // Regular dining halls...
    const isOpen = title === "Ferris" ? checkFerrisHours(title) : checkJohnJayHours(title);
    const fillPercentage = use / capacity;
    let barColor;
    if (fillPercentage < 0.25) {
      barColor = "#9AD94B";
    } else if (fillPercentage <= 0.5) {
      barColor = "#FFC632";
    } else if (fillPercentage <= 0.75) {
      barColor = "#E15C11";
    } else {
      barColor = "#E11111";
    }

    if (title === "Faculty House") {
      const isOpen = checkFacultyHours(title);
      return (
        <TouchableOpacity style={styles.diningButton}>
          <ImageBackground source={image} resizeMode="cover" style={styles.imageBackground}>
            <View style={styles.overlay} />
            <Text style={styles.buttonText}>{title}</Text>
            {isOpen ? (
              <View style={styles.progressBarContainer}>
                <View style={[
                  styles.progressBarFill, 
                  { 
                    width: '100%',
                    backgroundColor: "#9AD94B"
                  }
                ]} />
              </View>
            ) : (
              <Text style={[styles.capacityText, { color: '#FFFFFF' }]}>Closed</Text>
            )}
          </ImageBackground>
        </TouchableOpacity>
      );
    }

    // Update the capacity display
    const renderCapacity = () => {
      if (use === null) {
        return ""; // Show nothing while loading
      }
      return `${use}/${capacity}`;
    };

    return (
      <TouchableOpacity 
        style={styles.diningButton} 
        onPress={() => navigation.navigate(title.replace(/\s+/g, '') + "Menu")}
      >
        <ImageBackground source={image} resizeMode="cover" style={styles.imageBackground}>
          <View style={styles.overlay} />
          <Text style={styles.buttonText}>{title}</Text>
          {isOpen ? (
            <>
              <Text style={styles.capacityText}>{renderCapacity()}</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${fillPercentage * 100}%`, backgroundColor: barColor }]} />
          </View>
            </>
          ) : (
            <Text style={[styles.capacityText, { color: '#FFFFFF' }]}>Closed</Text>
          )}
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  const [diningHallScores, setDiningHallScores] = useState([]);

  useEffect(() => {
    async function fetchDiningData() {
      try {
        const { data: meals, error } = await supabase
          .from('nutrition_cache')
          .select('*');

        if (error) throw error;

        // Group meals by dining hall
        const diningHalls = {};
        meals.forEach(meal => {
          if (!diningHalls[meal.dining_hall]) {
            diningHalls[meal.dining_hall] = [];
          }
          diningHalls[meal.dining_hall].push(meal.nutrition_data);
        });

        // Calculate average scores for each dining hall
        const scoredHalls = Object.entries(diningHalls).map(([name, meals]) => {
          // Calculate averages
          const avgNutrition = meals.reduce((acc, meal) => {
            acc.protein += meal.protein;
            acc.calories += meal.calories;
            acc.fiber += meal.fiber;
            acc.fat += meal.fat;
            acc.sodium += meal.sodium;
            return acc;
          }, { protein: 0, calories: 0, fiber: 0, fat: 0, sodium: 0 });

          const mealCount = meals.length;
          Object.keys(avgNutrition).forEach(key => {
            avgNutrition[key] = avgNutrition[key] / mealCount;
          });

          // Calculate health score
          // 40% protein-to-calorie ratio
          // 30% fiber content
          // 30% penalty for high fat and sodium
          const proteinScore = (avgNutrition.protein / avgNutrition.calories) * 40;
          const fiberScore = (avgNutrition.fiber / 25) * 30; // 25g is daily recommended fiber
          const penaltyScore = Math.max(0, 30 - (avgNutrition.fat / 65 + avgNutrition.sodium / 2300) * 15);
          
          const totalScore = parseInt((proteinScore + fiberScore + penaltyScore).toFixed(0));

          return {
            name,
            score: totalScore,
            averages: avgNutrition,
            mealCount
          };
        }).sort((a, b) => b.score - a.score);

        setDiningHallScores(scoredHalls);
        
        // Store the recommended dining hall
        if (scoredHalls.length > 0) {
          setRecommendedDining(scoredHalls[0].name);
          console.log('Recommended Dining Hall:', scoredHalls[0].name);
          console.log('Health Score:', scoredHalls[0].score);
          console.log('Average Nutrition per Meal:');
          console.log('- Protein:', scoredHalls[0].averages.protein.toFixed(1) + 'g');
          console.log('- Calories:', scoredHalls[0].averages.calories.toFixed(0));
          console.log('- Fiber:', scoredHalls[0].averages.fiber.toFixed(1) + 'g');
          console.log('- Fat:', scoredHalls[0].averages.fat.toFixed(1) + 'g');
          console.log('- Sodium:', scoredHalls[0].averages.sodium.toFixed(0) + 'mg');
          console.log('Based on', scoredHalls[0].mealCount, 'meals');
        }

      } catch (error) {
        console.error('Error fetching dining data:', error);
      }
    }

    fetchDiningData();
  }, []);

  return (
  
  <View style = {styles.body}>
    <View style={styles.container}>
      
  
      <ScrollView 
        style={{ height: height - 82 }} 
        contentContainerStyle={{ alignItems: "center" }}
      >
        <View style={styles.header}>
          <View style={styles.top} >
            <Text style={styles.title}>
              Hey {userName || 'there'}
            </Text>
            <Text style={styles.desc}>Today's Recommended Dining Hall is <Text style={styles.bold}>{recommendedDining}</Text></Text>
          </View>
          <View style = {styles.image1}>
            <Image source={require("../assets/images/Animal Avatar.png")}/>
          </View>
        </View>

        {/* Welcome Text */}
        <View>
          <Text style={styles.notif}>Notifications</Text>
          <View  style={styles.notifbox}>
            <Image source={require("../assets/images/Sphere.png")}  style={styles.imageS}/>
            <Text style={styles.textN}>John invited you to join a table.</Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>GO</Text>
            </TouchableOpacity>
          </View>
          <View  style={styles.notifbox}>
            <Image source={require("../assets/images/Sphere.png")}  style={styles.imageS}/>
            <Text style={styles.textN}>Your weekly nutrition report is ready to go!</Text>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>GO</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style = {styles.box}>   
          <Text style={styles.titleD}>Dining</Text>
          <Text style={styles.subtitleD}>Based on your history & preferences.</Text>
          <View style = {styles.dining}>
            <View style={styles.diningRow}>
              <DiningButton 
                title="John Jay" 
                image={require("../assets/images/johnjay.jpg")} 
                use={johnJayData.use} 
                capacity={johnJayData.capacity} 
              />
              <DiningButton 
                title="JJs" 
                image={require("../assets/images/jjs.jpg")} 
                use={jjsData.use} 
                capacity={jjsData.capacity} 
              />
            </View>
            <View style={styles.diningRow}>
              <DiningButton 
                title="Faculty House" 
                image={require("../assets/images/fac.jpg")} 
              />
              <DiningButton title="Ferris" image={require("../assets/images/ferris.jpg")} use={ferrisData.use} capacity={ferrisData.capacity}  />
            </View>
            <View style={styles.diningRow}>
              <DiningButton title="Dianas" image={require("../assets/images/dianas.jpg")} />
              <DiningButton title="Hewitt" image={require("../assets/images/hewitt.jpg")} />
            </View>
            <View style={styles.diningRow}>
              <DiningButton title="Johnnys" image={require("../assets/images/johnnys.jpg")} />
              <DiningButton title="Fac Shack" image={require("../assets/images/facshack.jpg")} />
            </View>
            <View style={styles.diningRow}>
              <DiningButton 
                title="Chef Mikes" 
                image={require("../assets/images/chefmikes.jpg")} 
                use={chefMikesData.use} 
                capacity={chefMikesData.capacity} 
              />
              <DiningButton 
                title="Chef Dons" 
                image={require("../assets/images/chefdons.jpg")} 
              />
            </View>
          </View>
        </View>

      </ScrollView>
      <CustomBottomNav></CustomBottomNav>
   
    </View>
  </View>
  );
 
}



const styles = StyleSheet.create({
  bottom:{
    height: 82,
    width: 393,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    backgroundColor: "#FFFFFF",


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

 allLoc:{
  width: 142.84, 
  height: 36,
  backgroundColor: "#FFFFFF",
  borderRadius: 43.88,
  justifyContent: "center",
  alignItems: "center",

 },
 buttonLoc:{
  color:"rgba(66, 57, 52, 1)",
  fontSize: 14,
  fontWeight: "900",
 }, 
 buttonDiv:{
  width: "100%",
  alignItems: "center",
 },
  container: {
    flex: 1,
    backgroundColor: "#FDFECC",
    alignContent: "center",
    width: 393,
    paddingTop: 47, // Add top padding for iPhone bezel
  },
  titleD:{
    fontSize:28,
    color: "rgba(66, 57, 52, 1)",
    fontWeight: "900",
    marginLeft: 20,
    


  },
  diningRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 10,
  },
  diningButton: {
    width: 152,
    height: 70,
    borderRadius: 8,
    overflow: "hidden",
  },
  imageBackground: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  dining:{
    flexDirection: "column",
  
  },

  subtitleD:{
    fontSize:14,
    color: "#8D7861",
    fontWeight: "500",
    marginLeft: 20,
    

  },
  box:{
    backgroundColor: "#FFF47F",
    borderRadius: 15,
    width: 358,
    height: 500,
    justifyContent: "space-evenly",

  },
  top: {
    flexDirection:"column",
    marginTop: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    color: "rgba(66, 57, 52, 1)",
    fontWeight: "900",
    marginBottom: 10,
  },
  desc: {
    fontSize: 14,
    color: "rgba(66, 57, 52, 1)",
    fontWeight: "regular",
  },
  notifbox:{
    width: 349,
    height: 35,
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  imageS:{
    bottom:"60%",
    left: -5,
    position: "absolute",
  },
  textN:{
    marginLeft:15,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(101, 85, 72, 1)",
  },
  notif: {
    fontWeight: "900",
    fontSize: 15,
    color: "rgba(101, 85, 72, 1)",
    marginBottom: 10,

  },
  imageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  image1: {
    justifyContent: "center",
  },
  button: {
    backgroundColor: "#E15C11",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    width: 46,
    height: 35,
  },
  buttonText: {
    fontSize: 17.55,
    color: "#FFFFFF", // Light yellow text
    fontWeight: "900",
    marginLeft: "5%",

   
  },
  capacityText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "500",
    marginTop: 5,
    marginLeft: "5%",

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
});