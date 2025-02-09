import React from "react";
import { useState } from 'react';
import { View, Text, Image, StyleSheet, ImageBackground, TouchableOpacity, Dimensions, ScrollView, useWindowDimensions} from "react-native";
import { useNavigation } from '@react-navigation/native';



function CustomBottomNav() {
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
  const name = "Alice";
  const recommendedDining = "John Jay";
  const { height } = useWindowDimensions(); // Auto-updating height

 
  const DiningButton = ({ title, image, use, capacity }) => {
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
      <TouchableOpacity style={styles.diningButton}>
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
      
  
      <ScrollView style={{ height: height - 82 }} contentContainerStyle={{  marginLeft: 20 }}> 

        <View style={styles.header}>
          <View style={styles.top} >
            <Text style={styles.title}>Hey {name},</Text>
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
              <DiningButton title="John Jay" image={require("../assets/images/johnjay.jpg")} use={55} capacity = {80} />
              <DiningButton title="JJ's" image={require("../assets/images/jjs.jpg")} use={70} capacity = {70}  />
            </View>
            <View style={styles.diningRow}>
              <DiningButton title="Faculty House" image={require("../assets/images/fac.jpg")} use={30} capacity = {60}  />
              <DiningButton title="Ferris" image={require("../assets/images/ferris.jpg")} use={10} capacity = {93}  />
            </View>
          </View>
          <View style = {styles.buttonDiv}>
            <TouchableOpacity style={styles.allLoc}>
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
