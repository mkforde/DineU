import React from "react";
import { useState } from 'react';
import { View, Text, Image, StyleSheet, ImageBackground, TouchableOpacity, ScrollView, useWindowDimensions } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';


interface DiningButtonProps {
  title: string;
  image: any;  // or more specific type if needed
  use: number;
  capacity: number;
}

// Add these predefined arrays
const DINING_HALLS = [
  { id: 'johnjay', title: "John Jay", image: require("../assets/images/johnjay.jpg"), capacity: 400 },
  { id: 'jjs', title: "JJs", image: require("../assets/images/jjs.jpg"), capacity: 198 },
  { id: 'facultyhouse', title: "Faculty House", image: require("../assets/images/fac.jpg"), capacity: 60 },
  { id: 'ferris', title: "Ferris", image: require("../assets/images/ferris.jpg"), capacity: 363 },
  { id: 'dianas', title: "Dianas", image: require("../assets/images/dianas.jpg"), capacity: 120 },
  { id: 'hewitt', title: "Hewitt", image: require("../assets/images/hewitt.jpg"), capacity: 150 },
  { id: 'johnnys', title: "Johnnys", image: require("../assets/images/johnnys.jpg"), capacity: 60 },
  { id: 'facshack', title: "Fac Shack", image: require("../assets/images/facshack.jpg"), capacity: 60 },
  { id: 'chefmikes', title: "Chef Mikes", image: require("../assets/images/chefmikes.jpg"), capacity: 171 },
  { id: 'chefdons', title: "Chef Dons", image: require("../assets/images/chefdons.jpg"), capacity: 60 }
];

function CustomBottomNav() {
  const [activeTab, setActiveTab] = useState("table");
  const navigation = useNavigation();
  
  return (
    <View style={styles.bottom}>
      <TouchableOpacity onPress={() => { setActiveTab("home"); navigation.navigate("home"); }}>
        <Image
          source={require("../assets/images/home.png")}
          style={[activeTab === "home" && styles.activeIcon]}
        />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => { setActiveTab("table"); navigation.navigate("table"); }}>
        <Image
          source={require("../assets/images/Table.png")}
          style={[activeTab === "table" && styles.activeIcon]}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => { setActiveTab("location"); navigation.navigate("location"); }}>
        <Image
          source={require("../assets/images/location.png")}
          style={[activeTab === "location" && styles.activeIcon]}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => { setActiveTab("profile"); navigation.navigate("profile"); }}>
        <Image
          source={require("../assets/images/profile.png")}
          style={[activeTab === "profile" && styles.activeIcon]}
        />
      </TouchableOpacity>
    </View>
  );
}
export default function WelcomeScreen() {
  const { height } = useWindowDimensions();
  
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

    // Create dining hall object with all necessary info
    const diningHall = {
      name: title,
      image: image,
      use: use,
      capacity: capacity
    };

    return (
      <TouchableOpacity 
        style={styles.diningButton}
        onPress={() => {
          navigation.navigate('CreateTableStep2', { diningHall }); // Pass the full object
        }}
      >
        <ImageBackground source={image} resizeMode="cover" style={styles.imageBackground}>
          <View style={styles.overlay} />
          <Text style={styles.buttonText}>{title}</Text>
          {/* Progress Bar */}
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.body}>
      <View style={styles.container}>
        <ScrollView style={{ height: height - 82 }}>
          <View style={styles.top}>
            <Text style={styles.title}>Create a table</Text>
            <Image source={require("../assets/images/Progress bar 1.png")}/>
          </View>
          <Text style={styles.subtitle}>Choose your dining hall:</Text>
          <View style={styles.dining}>
            {DINING_HALLS.reduce((rows, hall, index) => {
              if (index % 2 === 0) rows.push([]);
              rows[rows.length - 1].push(hall);
              return rows;
            }, []).map((row, i) => (
              <View key={i} style={styles.diningRow}>
                {row.map(hall => (
                  <DiningButton
                    key={hall.id}
                    title={hall.title}
                    image={hall.image}
                    use={ 0}
                    capacity={hall.capacity}
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Existing styles remain the same
  bottom: {
    height: 82,
    width: 393,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  body: {
    width: "100%",
    alignItems: "center",
    flex: 1,
    fontFamily: "Helvetica",
  },
  container: {
    flex: 1,
    backgroundColor: "#FDFECC",
    alignContent: "center",
    width: 393,
  },
  top: {
    flexDirection: "column",
    marginTop: 30,
    marginBottom:30,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    color: "rgba(66, 57, 52, 1)",
    fontWeight: "900",
    marginBottom: 10,
  },
  subtitle:{
    fontSize: 20,
    fontWeight: 600,
    color: "#CCCCCC",
    marginLeft: 20,
    marginBottom:20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    gap: 20,
  },
  notif: {
    fontWeight: "900",
    fontSize: 20,
    color: "rgba(101, 85, 72, 1)",
    marginBottom: 10,
    marginLeft: 20,
  },
  
  // Modified and new styles for table chats
  tableChatsSection: {
    flex: 1,
  },
  chatsContainer: {
    padding: 15,
  },
  chatPreview: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: "#FDFECC",
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  privateChatOverlay: {
    backgroundColor: '#E7EE71',
    position: 'relative',
    // Add semi-transparent overlay
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.05,
    shadowRadius: 0,
    elevation: 1,
  },
  chatImageContainer: {
    position: 'relative',
    marginRight: 15,
  },
 
  lockContainer: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: '#E15C11',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    width: 14,
    height: 14,
    tintColor: '#FFFFFF',
  },
  chatInfo: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#423934',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#8D7861',
  },
  chatMeta: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    color: '#8D7861',
    marginBottom: 5,
  },
  unreadBadge: {
    backgroundColor: '#E15C11',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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


  box:{
    backgroundColor: "#FFF47F",
    borderRadius: 15,
    width: 358,
    height: 500,
    justifyContent: "space-evenly",

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