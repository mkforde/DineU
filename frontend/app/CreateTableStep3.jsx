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

// Predefined arrays for vibes and interests
const VIBES = [
  "Chill & Casual",
  "Debate & Discuss",
  "Lively & Social",
  "Cram Session",
  "Quiet & Relaxed",
  "Speedy Vibes"
];

const INTERESTS = [
  "Music & Arts",
  "Travel & Adventure",
  "Gaming & Esports",
  "STEM & Tech Talk",
  "Fitness & Wellness",
  "Foodies & Chefs"
];

export default function CreateTableStep3() {
  const { height } = useWindowDimensions();
  const navigation = useNavigation();
  const route = useRoute();
  
  const { diningHall, tableName, isPrivate, tableSize } = route.params || {};

  const [selectedVibes, setSelectedVibes] = useState([]);
  const [selectedInterests, setSelectedInterests] = useState([]);

  const toggleVibe = (vibe) => {
    setSelectedVibes(prev => 
      prev.includes(vibe) 
        ? prev.filter(v => v !== vibe)
        : [...prev, vibe]
    );
  };

  const toggleInterest = (interest) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async () => {
    try {
      const user = supabase.auth.user();
      if (!user) {
        alert('Please sign in to create a table');
        return;
      }

      // Create the table
      const { data: table, error: tableError } = await supabase
        .from('dining_tables')
        .insert({
          dining_hall: diningHall.id,
          table_name: tableName,
          is_private: isPrivate,
          team_size: tableSize,
          created_by: user.id,
          pin: isPrivate ? Math.floor(1000 + Math.random() * 9000).toString() : null
        })
        .single();

      if (tableError) throw tableError;

      // Add topics
      const { error: topicsError } = await supabase
        .from('table_topics')
        .insert({
          table_id: table.id,
          vibe: selectedVibes,
          interests: selectedInterests
        });

      if (topicsError) throw topicsError;

      // Add creator as first member
      const { error: memberError } = await supabase
        .from('table_members')
        .insert({
          table_id: table.id,
          user_id: user.id
        });

      if (memberError) throw memberError;

      navigation.navigate('GenerateTable', {
        tableId: table.id,
        diningHall,
        tableName,
        isPrivate,
        tableSize,
        selectedVibes,
        selectedInterests
      });

    } catch (error) {
      console.error('Error creating table:', error);
      alert('Failed to create table. Please try again.');
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
        <ScrollView style={{ height: height - 82 }}>
          <View style={styles.top}>
            <Text style={styles.title}>Set the Vibe</Text>
            <Text style={styles.subtitle}>for {tableName}</Text>
            <Image source={require("../assets/images/Progress bar3.png")}/>
          </View>

          {/* Vibes Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's the vibe?</Text>
            <View style={styles.tagsContainer}>
              {VIBES.map((vibe) => (
                <TouchableOpacity
                  key={vibe}
                  style={[
                    styles.tagButton,
                    selectedVibes.includes(vibe) && styles.selectedTagButton
                  ]}
                  onPress={() => toggleVibe(vibe)}
                >
                  <Text style={[
                    styles.tagText,
                    selectedVibes.includes(vibe) && styles.selectedTagText
                  ]}>
                    {vibe}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Interests Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interests/topics:</Text>
            <View style={styles.tagsContainer}>
              {INTERESTS.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.tagButton,
                    selectedInterests.includes(interest) && styles.selectedTagButton
                  ]}
                  onPress={() => toggleInterest(interest)}
                >
                  <Text style={[
                    styles.tagText,
                    selectedInterests.includes(interest) && styles.selectedTagText
                  ]}>
                    {interest}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>Create a table</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginBottom:20,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#423934",
    marginBottom: 15,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tagButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTagButton: {
    backgroundColor: "#E15C11",
  },
  tagText: {
    color: "#423934",
    fontSize: 14,
    fontWeight: "500",
  },
  selectedTagText: {
    color: "#FFFFFF",
  },
  submitButton: {
    backgroundColor: "#E15C11",
    margin: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
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
});