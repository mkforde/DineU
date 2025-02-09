import React from "react";
import { useState } from 'react';
import { View, Text, Image, StyleSheet, ImageBackground, TouchableOpacity, ScrollView, useWindowDimensions } from "react-native";
import { useNavigation } from '@react-navigation/native';


interface DiningButtonProps {
  title: string;
  image: any;  // or more specific type if needed
  use: number;
  capacity: number;
}


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
  const navigation = useNavigation();
  
  const DiningButton = ({ title, image, use, capacity }: DiningButtonProps) => {
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
        onPress={() => {
          navigation.navigate("CreateTableStep2", {
            diningHall: title
          });
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
        <ScrollView style={{ height: height - 82, marginBottom: 80 }}>
          <View style={styles.top}>
            <Text style={styles.title}>Create a table</Text>
            <Image source={require("../assets/images/Progress bar 1.png")}/>
          </View>
          <Text style={styles.subtitle}>Choose your dining hall:</Text>
          <View style={styles.dining}>
            <View style={styles.diningRow}>
              <DiningButton title="John Jay" image={require("../assets/images/johnjay.jpg")} use={55} capacity = {80}  />
              <DiningButton title="JJs" image={require("../assets/images/jjs.jpg")} use={70} capacity = {70}  />
            </View>
            <View style={styles.diningRow}>
              <DiningButton title="Faculty House" image={require("../assets/images/fac.jpg")} use={30} capacity = {60}  />
              <DiningButton title="Ferris" image={require("../assets/images/ferris.jpg")} use={10} capacity = {93}  />
            </View>
            <View style={styles.diningRow}>
              <DiningButton title="Dianas" image={require("../assets/images/dianas.jpg")} use={30} capacity = {60}  />
              <DiningButton title="Hewitt" image={require("../assets/images/hewitt.jpg")} use={10} capacity = {93}  />
            </View>
            <View style={styles.diningRow}>
              <DiningButton title="Johnnys" image={require("../assets/images/johnnys.jpg")} use={30} capacity = {60}  />
              <DiningButton title="Fac Shack" image={require("../assets/images/facshack.jpg")} use={10} capacity = {93}  />
            </View>
            <View style={styles.diningRow}>
              <DiningButton title="Chef Mikes" image={require("../assets/images/chefmikes.jpg")} use={30} capacity = {60}  />
              <DiningButton title="Chef Dons" image={require("../assets/images/chefdons.jpg")} use={10} capacity = {93}  />
            </View>
          </View>
        </ScrollView>
        
        <View style={styles.closeButtonContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => navigation.navigate('table')}
          >
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
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

  closeButtonContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#FDFECC',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  closeButton: {
    backgroundColor: "#E15C11",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

});