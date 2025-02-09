import React, { useEffect, useRef } from "react";
import { useState } from 'react';
import { View, Text, Image, StyleSheet, ImageBackground, TouchableOpacity, Dimensions, ScrollView, useWindowDimensions} from "react-native";
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useNavigation } from '@react-navigation/native';
import App from '../config/maps';

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
  const recommendedDining = "John Jay";
  const { height } = useWindowDimensions();

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
        const directoryResponse = await fetch(`http://localhost:3000/api/directory/user/${uni}`);
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

  return (
  
  <View style = {styles.body}>
    <View style={styles.container}>
       
        <App></App>
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
