import React, { useState } from "react";
import { View, Text, Image, StyleSheet, ImageBackground, TouchableOpacity, ScrollView, useWindowDimensions, TextInput } from "react-native";
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../lib/supabase';


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
export default function CreateTableStep2() {
  const { height } = useWindowDimensions();
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get the dining hall object from route params
  const diningHall = route.params?.diningHall;

  if (!diningHall) {
    // If no dining hall was selected, go back to selection
    navigation.navigate('createtable');
    return null;
  }

  const [tableName, setTableName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [tableSize, setTableSize] = useState(2);

  const validateTableName = async (name: string) => {
    if (!name) return false;
    
    // Check if table name exists for this dining hall
    const { data, error } = await supabase
      .from('dining_tables')
      .select('id')
      .eq('dining_hall', diningHall.id)
      .eq('table_name', name)
      .eq('active', true)
      .single();

    if (error) {
      console.error('Error checking table name:', error);
      return false;
    }

    return !data; // Return true if name is available
  };

  const handleSubmit = async () => {
    if (tableName.length === 0 || tableName.length > 10) {
      alert('Table name must be between 1 and 10 characters');
      return;
    }

    // Check if table name exists
    const { data: existingTable, error: checkError } = await supabase
      .from('dining_tables')
      .select('id')
      .eq('dining_hall', diningHall.name)  // Use diningHall.name here
      .eq('table_name', tableName)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking table name:', checkError);
      alert('Error checking table name availability');
      return;
    }

    if (existingTable) {
      alert('This table name is already taken in this dining hall');
      return;
    }

    // If all checks pass, navigate to next step
    navigation.navigate('CreateTableStep3', {
      diningHall,
      tableName,
      isPrivate,
      tableSize
    });
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
        onPress={() => {
          navigation.navigate('CreateTableStep2', { diningHall: title });
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
            <Text style={styles.subtitle}>at {diningHall.name}</Text>
            <Image source={require("../assets/images/Project bar 2.png")}/>
          </View>

          {/* Table Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Table Name (max 10 characters)</Text>
            <TextInput
              style={styles.input}
              value={tableName}
              onChangeText={(text) => setTableName(text.slice(0, 10))}
              placeholder="Enter table name"
              maxLength={10}
            />
          </View>

          {/* Privacy Toggle */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Table Privacy</Text>
            <View style={styles.toggleContainer}>
              <TouchableOpacity 
                style={[styles.toggleButton, !isPrivate && styles.activeToggle]}
                onPress={() => setIsPrivate(false)}
              >
                <Text style={[styles.toggleText, !isPrivate && styles.activeToggleText]}>Public</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.toggleButton, isPrivate && styles.activeToggle]}
                onPress={() => setIsPrivate(true)}
              >
                <Text style={[styles.toggleText, isPrivate && styles.activeToggleText]}>Private</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Table Size Selector */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Table Size</Text>
            <View style={styles.sizeContainer}>
              {[2, 4, 6, 8].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[styles.sizeButton, tableSize === size && styles.activeSizeButton]}
                  onPress={() => setTableSize(size)}
                >
                  <Text style={[styles.sizeText, tableSize === size && styles.activeSizeText]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, tableName.length === 0 && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={tableName.length === 0}
          >
            <Text style={styles.submitButtonText}>Continue</Text>
          </TouchableOpacity>
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
    marginBottom: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    color: "rgba(66, 57, 52, 1)",
    fontWeight: "900",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    color: "#423934",
    fontWeight: "600",
    marginBottom: 20,
  },
  inputSection: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#423934",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: "#E15C11",
  },
  toggleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#423934",
  },
  activeToggleText: {
    color: "white",
  },
  sizeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sizeButton: {
    width: 70,
    height: 70,
    backgroundColor: "white",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  activeSizeButton: {
    backgroundColor: "#E15C11",
  },
  sizeText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#423934",
  },
  activeSizeText: {
    color: "white",
  },
  submitButton: {
    backgroundColor: "#E15C11",
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "#CCCCCC",
  },
  submitButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
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
  buttonText: {
    fontSize: 17.55,
    color: "#FFFFFF", // Light yellow text
    fontWeight: "900",
    marginLeft: "5%",
  },
  closeButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "#FFFFFF",
  },
  closeButton: {
    backgroundColor: "#E15C11",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});