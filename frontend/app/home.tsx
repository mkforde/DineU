import React, { useEffect, useRef } from "react";
import { useState } from 'react';
import { View, Text, Image, StyleSheet, ImageBackground, TouchableOpacity, Dimensions, ScrollView, useWindowDimensions} from "react-native";
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';

interface DiningButtonProps {
  title: string;
  image: any;  // or more specific type if needed
  use: number;
  capacity: number;
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

      <TouchableOpacity onPress={() => { setActiveTab("nutrition"); navigation.navigate("nutrition"); }}>
        <Image
          source={require("../assets/images/icon_nutrition.png")}
          style={[ activeTab === "nutrition" && styles.activeIcon]}
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
  const router = useRouter();  // Move router to top
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);  // Add loading state
  const recommendedDining = "John Jay";
  const { height } = useWindowDimensions();
  const dataFetched = useRef(false);

  useEffect(() => {
    if (!router) return;  // Add null check
    
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
      }
    };
    checkAuth();
  }, [router]);

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
    const fillPercentage = use / capacity;
    
    // Determine bar color
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

    return (
      <TouchableOpacity 
        style={styles.diningButton} 
        onPress={() => navigation.navigate(title.replace(/\s+/g, '') + "Menu")}
      >
        <ImageBackground source={image} resizeMode="cover" style={styles.imageBackground}>
          <View style={styles.overlay} />
          <Text style={styles.buttonText}>{title}</Text>
          <Text style={styles.capacityText}>{use}/{capacity}</Text>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${fillPercentage * 100}%`, backgroundColor: barColor }]} />
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    async function createProfileIfNeeded() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // First check if profile exists with firstName
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('firstName')
          .eq('id', session.user.id)
          .single();

        // Only fetch directory data if profile doesn't exist or firstName is null
        if (!existingProfile || !existingProfile.firstName) {
          const email = session.user.email;
          const uni = email?.split('@')[0];

          try {
            const directoryResponse = await fetch(`http://localhost:3000/api/directory/user/${uni}`);
            const directoryData = await directoryResponse.json();
            console.log('Directory lookup result:', directoryData);

            // Create/update profile with firstName
            const { error: createError } = await supabase
              .from('profiles')
              .upsert({
                id: session.user.id,
                uni: uni,
                email: email,
                firstName: directoryData.success ? directoryData.data.firstName : null
              })
              .select()
              .single();

            if (createError) {
              console.error('Error creating profile:', createError);
            }
          } catch (error) {
            console.error('Error fetching directory data:', error);
          }
        } else {
          console.log('Profile already exists with firstName:', existingProfile.firstName);
        }
      }
    }

    createProfileIfNeeded();
  }, []);

  // Update the fetch userName effect
  useEffect(() => {
    async function fetchUserName() {
      try {
        setIsLoading(true);  // Start loading
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('firstName')
            .eq('id', session.user.id)
            .single();
          
          if (profile?.firstName) {
            setUserName(profile.firstName);
          }
        }
      } catch (error) {
        console.error('Error fetching username:', error);
      } finally {
        setIsLoading(false);  // End loading
      }
    }

    fetchUserName();
  }, []);

  return (
  
  <View style = {styles.body}>
    <View style={styles.container}>
      
  
      <ScrollView style={{ height: height - 82 }} contentContainerStyle={{  marginLeft: 20 }}> 

        <View style={styles.header}>
          <View style={styles.top} >
            <Text style={styles.title}>
              Hey {isLoading ? '...' : userName || 'there'},
            </Text>
            <Text style={styles.desc}>Let's hit up <Text style={styles.bold}>{recommendedDining}</Text>, your usual spot.</Text>
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
              <DiningButton title="John Jay" image={require("../assets/images/johnjay.jpg")} use={55} capacity = {80}  />
              <DiningButton title="JJ's" image={require("../assets/images/jjs.jpg")} use={70} capacity = {70}  />
            </View>
            <View style={styles.diningRow}>
              <DiningButton title="Faculty House" image={require("../assets/images/fac.jpg")} use={30} capacity = {60}  />
              <DiningButton title="Ferris" image={require("../assets/images/ferris.jpg")} use={10} capacity = {93}  />
            </View>
          </View>
          <View style = {styles.buttonDiv}>
            <TouchableOpacity 
              style={styles.allLoc} 
              onPress={handleExplorePress}
            >
              <Text style={styles.buttonLoc}>See all Locations</Text>
            </TouchableOpacity>
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
    backgroundColor: "#FDFECC", // Light yellow background
    alignContent: "center",
    width: 393,
  
    
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
    height: 307,
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
