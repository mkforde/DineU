import React, { useEffect, useState } from "react";
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
export default function GenerateTable() {
  const { height } = useWindowDimensions();
  const route = useRoute();
  const navigation = useNavigation();
  const [tableData, setTableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPinOverlay, setShowPinOverlay] = useState(true);
  
  // Get all params from route
  const { 
    tableId,
    diningHall = "",
    tableName = "",
    isPrivate = false,
    tableSize = 2,
    selectedVibes = [],
    selectedInterests = [],
    pin = null
  } = route.params || {};

  useEffect(() => {
    if (isPrivate) {
      // No need to generate PIN here anymore since it's created in CreateTableStep3
    } else {
      // If public, wait 3 seconds then navigate to table.tsx
      const timer = setTimeout(() => {
        navigation.navigate('table');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isPrivate, navigation]);

  useEffect(() => {
    async function fetchTableData() {
      try {
        // Fetch table details
        const { data: table, error: tableError } = await supabase
          .from('dining_tables')
          .select('*')
          .eq('id', tableId)
          .single();

        if (tableError) throw tableError;

        // Fetch table interests (both vibes and regular interests)
        const { data: tableInterests, error: interestsError } = await supabase
          .from('table_interests')
          .select(`
            table_id,
            interest_id,
            interest:interests (
              id,
              name
            )
          `)
          .eq('table_id', tableId);

        if (interestsError) throw interestsError;

        // Fetch current members
        const { data: members, error: membersError } = await supabase
          .from('members')
          .select('*')
          .eq('table_id', tableId)
          .is('left_at', null);

        if (membersError) throw membersError;

        // Combine all data
        setTableData({
          ...table,
          interests: tableInterests.map(ti => ti.interest.name),
          members: members
        });

      } catch (error) {
        console.error('Error fetching table data:', error);
        alert('Failed to load table data');
      } finally {
        setLoading(false);
      }
    }

    if (tableId) {
      fetchTableData();
    }
  }, [tableId]);

  const handleSubmit = () => {
    navigation.navigate('GenerateTable', {
      diningHall,
      tableName,
      isPrivate,
      tableSize,
      selectedVibes,
      selectedInterests
    });
  };

  const handleBackToTables = () => {
    navigation.navigate('table');
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

  const joinTable = async () => {
    try {
      // Get current user's session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!session?.user) {
        alert('Please sign in to join a table');
        return;
      }

      // Get user's profile to get their UNI
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('uni')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw profileError;

      if (!profile?.uni) {
        alert('Could not find your UNI. Please update your profile.');
        return;
      }

      // Use the stored procedure with the actual UNI
      const { error } = await supabase.rpc('join_table', {
        p_table_id: tableId,
        p_uni: profile.uni
      });

      if (error) throw error;

      // Refresh table data after joining
      fetchTableData();

    } catch (error) {
      console.error('Error joining table:', error);
      alert('Failed to join table. Please try again.');
    }
  };

  return (
    <View style={styles.body}>
      {/* PIN Overlay for private tables */}
      {showPinOverlay && isPrivate && (tableData?.pin || pin) && (
        <View style={styles.overlay}>
          <View style={styles.pinOverlayCard}>
            <Text style={styles.pinOverlayTitle}>Your Table PIN</Text>
            <Text style={styles.pinOverlayValue}>{tableData?.pin || pin}</Text>
            <Text style={styles.pinOverlayNote}>
              Make sure to save this PIN! {'\n'}
              You'll need it to share with friends who want to join.
            </Text>
            <TouchableOpacity 
              style={styles.gotItButton}
              onPress={() => setShowPinOverlay(false)}
            >
              <Text style={styles.gotItButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.container}>
        <ScrollView style={{ height: height - 82 }}>
          <View style={styles.top}>
            <Text style={styles.title}>{tableData?.table_name || tableName}</Text>
            <Text style={styles.subtitle}>at {diningHall.name}</Text>
          </View>
          
        

          <View style={styles.infoContainer}>
            {/* Table Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Table Details</Text>
              <View style={styles.detailCard}>
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Privacy:</Text>
                  <Text style={styles.value}>{isPrivate ? 'Private' : 'Public'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.label}>Capacity:</Text>
                  <Text style={styles.value}>{tableSize} people</Text>
                </View>
                {isPrivate && (
                  <View style={styles.pinContainer}>
                    <Text style={styles.pinLabel}>Table PIN:</Text>
                    <Text style={styles.pinValue}>{tableData?.pin || pin}</Text>
                    <Text style={styles.pinNote}>Share this PIN with people you want to join your table</Text>
                    <TouchableOpacity 
                      style={styles.backButton}
                      onPress={handleBackToTables}
                    >
                      <Text style={styles.backButtonText}>Back to Tables</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {!isPrivate && (
                  <View style={styles.redirectMessage}>
                    <Text style={styles.redirectText}>Redirecting to tables...</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Combined Vibes & Interests Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Table Topics & Vibes</Text>
              <View style={styles.detailCard}>
                {selectedVibes.length > 0 && (
                  <View style={styles.topicGroup}>
                    <Text style={styles.topicLabel}>Vibes:</Text>
                    <View style={styles.tagsContainer}>
                      {selectedVibes.map((vibe) => (
                        <View key={vibe} style={styles.tag}>
                          <Text style={styles.tagText}>{vibe}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                
                {selectedInterests.length > 0 && (
                  <View style={[styles.topicGroup, selectedVibes.length > 0 && styles.topicGroupBorder]}>
                    <Text style={styles.topicLabel}>Interests:</Text>
                    <View style={styles.tagsContainer}>
                      {selectedInterests.map((interest) => (
                        <View key={interest} style={styles.tag}>
                          <Text style={styles.tagText}>{interest}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
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
  },
  infoContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#423934",
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    color: "#423934",
    fontWeight: "500",
  },
  value: {
    fontSize: 16,
    color: "#423934",
  },
  pinContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  pinLabel: {
    fontSize: 16,
    color: "#423934",
    fontWeight: "600",
    marginBottom: 8,
  },
  pinValue: {
    fontSize: 32,
    color: "#E15C11",
    fontWeight: "bold",
    letterSpacing: 4,
    marginBottom: 8,
  },
  pinNote: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  redirectMessage: {
    marginTop: 16,
    alignItems: "center",
  },
  redirectText: {
    fontSize: 16,
    color: "#666666",
    fontStyle: "italic",
  },
  topicGroup: {
    padding: 12,
  },
  topicGroupBorder: {
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  topicLabel: {
    fontSize: 16,
    color: "#423934",
    fontWeight: "600",
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#E15C11",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  pinOverlayCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    width: 394,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pinOverlayTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#423934',
    marginBottom: 16,
  },
  pinOverlayValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#E15C11',
    marginBottom: 16,
    letterSpacing: 4,
  },
  pinOverlayNote: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  gotItButton: {
    backgroundColor: '#E15C11',
    paddingVertical: 12,
    paddingHorizontal: 48,
    borderRadius: 8,
  },
  gotItButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonText: {
    fontSize: 17.55,
    color: "#FFFFFF", // Light yellow text
    fontWeight: "900",
    marginLeft: "5%",
  },
  backButton: {
    backgroundColor: "#E15C11",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    width: "100%",
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statsText: {
    fontSize: 16,
    color: "#423934",
    fontWeight: "500",
  },
});