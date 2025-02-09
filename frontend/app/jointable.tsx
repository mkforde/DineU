import React, { useState, useEffect } from "react";
import { 
  View, Text, Image, StyleSheet, TouchableOpacity, 
  ScrollView, useWindowDimensions, Animated, TextInput 
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import { supabase } from "../lib/supabase";

// Modified Selection component to be controlled by parent state
export function Selection({ activeTab, onTabChange }) {
  const [pressedTab, setPressedTab] = useState(null);
  const [pressAnimation] = useState(new Animated.Value(1));

  const handlePressIn = (index) => {
    setPressedTab(index);
    Animated.spring(pressAnimation, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setPressedTab(null);
    Animated.spring(pressAnimation, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = (index) => {
    onTabChange(index); // Update the parent's activeTab state
  };

  const getTabStyle = (index) => {
    const isPressed = pressedTab === index;
    const isActive = activeTab === index;
    
    const baseStyle = [
      styles.tabBase,
      index === 0 && styles.tab1,
      index === 1 && styles.tab2,
      isActive && styles.activeTab,
      isPressed && styles.pressedTab
    ];

    return baseStyle;
  };

  return (
    <View style={styles.tabs}>
      {['Private', 'Public'].map((label, index) => (
        <Animated.View 
          key={index}
          style={[
            { transform: [{ scale: pressAnimation }] }
          ]}
        >
          <TouchableOpacity
            style={getTabStyle(index)}
            onPressIn={() => handlePressIn(index)}
            onPressOut={handlePressOut}
            onPress={() => handlePress(index)}
            activeOpacity={0.9}
          >
            <Text style={[
              styles.tabText,
              activeTab === index && styles.activeTabText
            ]}>
              {label}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );
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

// Update PrivateTableSearch component
const PrivateTableSearch = () => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');  // Add error state
  const [pinAttempts, setPinAttempts] = useState(0);  // Track attempts for UX

  const handleJoinPrivateTable = async () => {
    setError('');  // Clear previous errors
    
    if (!pin || pin.length !== 4) {
      setError('Please enter a valid 4-digit PIN');
      return;
    }

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        setError('Please sign in to join a table');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('uni')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        setError('Could not find your profile');
        return;
      }

      if (!profile?.uni) {
        setError('Could not find your UNI. Please update your profile.');
        return;
      }

      // First find the table with this PIN
      const { data: table, error: tableError } = await supabase
        .from('dining_tables')
        .select('*')
        .eq('pin', pin)
        .eq('privacy', 'private')
        .single();

      if (tableError || !table) {
        setPinAttempts(prev => prev + 1);
        setError(pinAttempts >= 2 ? 
          'Multiple invalid attempts. Please check the PIN carefully.' : 
          'Invalid PIN or table not found'
        );
        return;
      }

      // Check if table is full
      if (table.current_members >= parseInt(table.size)) {
        setError('This table is full');
        return;
      }

      // Use the stored procedure to join the table
      const { error: joinError } = await supabase.rpc('join_table', {
        p_table_id: table.id,
        p_uni: profile.uni
      });

      if (joinError) throw joinError;

      // Clear the PIN input and errors on success
      setPin('');
      setError('');
      setPinAttempts(0);
      alert('Successfully joined the table!');

    } catch (error) {
      console.error('Error joining private table:', error);
      setError('Failed to join table. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.privateSearchContainer}>
      <Text style={styles.sectionTitle}>Enter Private Table Details</Text>
      
      <TextInput 
        style={[
          styles.input,
          error && styles.inputError  // Add red border when there's an error
        ]}
        placeholder="Enter 4-digit PIN"
        value={pin}
        onChangeText={(text) => {
          setPin(text);
          setError('');  // Clear error when user types
        }}
        keyboardType="numeric"
        maxLength={4}
        secureTextEntry
      />

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <Text style={styles.helperText}>
          Enter the 4-digit PIN shared by the table host
        </Text>
      )}

      <TouchableOpacity 
        style={[
          styles.joinButton, 
          loading && styles.joinButtonDisabled,
          error && styles.joinButtonError
        ]}
        onPress={handleJoinPrivateTable}
        disabled={loading}
      >
        <Text style={styles.joinButtonText}>
          {loading ? 'Joining...' : 'Join Private Table'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// Component for topic flair
const TopicFlair = ({ topic }) => (
  <View style={styles.flair}>
    <Text style={styles.flairText}>{topic}</Text>
  </View>
);

// Updated TableChatPreview component
const TableChatPreview = ({ 
  id,
  title, 
  topics, 
  currentSize, 
  maxCapacity, 
  location, 
  time, 
  onPress 
}) => (
  <TouchableOpacity 
    style={styles.chatPreview}
  >
    <View style={styles.chatHeader}>
      <Image
        source={require("../assets/images/group_icon.png")}
      />
      <View>
        <Text style={styles.chatTitle}>{title}</Text>
        <Text style={styles.locationText}>📍{location}</Text>
      </View>
      <View style={styles.capacityBadge}>
        <Text style={styles.capacityText}>{currentSize}/{maxCapacity}</Text>
      </View>
    </View>
    
    <View style={styles.flairContainer}>
      {topics.map((topic, index) => (
        <TopicFlair key={index} topic={topic} />
      ))}
    </View>
    
    <View style={styles.chatFooter}>
      <Text style={styles.timeText}>{time}</Text>
      <TouchableOpacity 
        style={[
          styles.joinButton, 
          currentSize >= maxCapacity && styles.joinButtonDisabled
        ]}
        disabled={currentSize >= maxCapacity}
        onPress={() => onPress(id)}
      >
        <Text style={styles.joinButtonText}>
          {currentSize >= maxCapacity ? 'Full' : 'Join Table'}
        </Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

export default function WelcomeScreen() {
  const { height } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState(0);
  const navigation = useNavigation();
  const [publicTables, setPublicTables] = useState([]);
  const [loading, setLoading] = useState(true);

  // Move fetchPublicTables outside useEffect so it can be reused
  const fetchPublicTables = async () => {
    try {
      setLoading(true);
      const { data: tables, error } = await supabase
        .from('dining_tables')
        .select(`
          id,
          dining_hall,
          table_name,
          size,
          current_members,
          created_at,
          table_interests (
            interest:interests (
              name
            )
          )
        `)
        .eq('privacy', 'public')
        .eq('is_locked', false)
        .gt('current_members', 0)
        .lt('current_members', 8);

      if (error) throw error;

      const formattedTables = tables.map(table => ({
        id: table.id,
        title: table.table_name,
        location: table.dining_hall,
        topics: table.table_interests.map(ti => ti.interest.name),
        currentSize: table.current_members,
        maxCapacity: parseInt(table.size),
        time: getTimeDisplay(table.created_at)
      }));

      setPublicTables(formattedTables);
    } catch (error) {
      console.error('Error fetching public tables:', error);
      alert('Failed to load available tables');
    } finally {
      setLoading(false);
    }
  };

  // Use fetchPublicTables in useEffect
  useEffect(() => {
    if (activeTab === 1) {
      fetchPublicTables();
    }
  }, [activeTab]);

  // Helper function to format time display
  const getTimeDisplay = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Starting now';
    if (diffMinutes < 60) return `Started ${diffMinutes}m ago`;
    return `Started ${Math.floor(diffMinutes / 60)}h ago`;
  };

  // Now handleJoinTable can access fetchPublicTables
  const handleJoinTable = async (tableId: number) => {
    try {
      setLoading(true); // Add loading state while joining

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

      // Check if user is already in the table
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('members')
        .select('*')
        .eq('table_id', tableId)
        .eq('uni', profile.uni)
        .single();

      if (existingMember) {
        alert('You are already a member of this table!');
        navigation.navigate('table'); // Navigate to tables screen
        return;
      }

      // Use the stored procedure to join the table
      const { error: joinError } = await supabase.rpc('join_table', {
        p_table_id: tableId,
        p_uni: profile.uni
      });

      if (joinError) throw joinError;

      alert('Successfully joined the table!');
      navigation.navigate('table'); // Navigate to tables screen

    } catch (error) {
      console.error('Error joining table:', error);
      alert('Failed to join table. Please try again.');
    } finally {
      setLoading(false);
      fetchPublicTables(); // Refresh the tables list
    }
  };

  return (
    <View style={styles.body}>
      <View style={styles.container}>
        <ScrollView style={{ height: height - 82 }}>
          <View style={styles.top}>
            <Text style={styles.title}>Join a table</Text>
          </View>
          {/* Pass the activeTab state and update function to Selection */}
          <Selection activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === 0 ? (
            <PrivateTableSearch />
          ) : (
            <View style={styles.tableChatsSection}>
              <Text style={styles.notif}>Available Tables</Text>
              <View style={styles.chatsContainer}>
                {loading ? (
                  <Text>Loading available tables...</Text>
                ) : publicTables.length === 0 ? (
                  <Text>No tables available at the moment</Text>
                ) : (
                  publicTables.map(table => (
                    <TableChatPreview
                      key={table.id}
                      id={table.id}
                      title={table.title}
                      topics={table.topics}
                      currentSize={table.currentSize}
                      maxCapacity={table.maxCapacity}
                      location={table.location}
                      time={table.time}
                      onPress={handleJoinTable}
                    />
                  ))
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
      <CustomBottomNav />
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
    marginLeft: 20,
  },
  title: {
    fontSize: 32,
    color: "rgba(66, 57, 52, 1)",
    fontWeight: "900",
    marginBottom: 10,
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
  // Styles for table chats
  tableChatsSection: {
    flex: 1,
  },
  chatsContainer: {
    padding: 15,
  },
  chatPreview: {
    backgroundColor: '#F2F1BB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#423934',
  },
  capacityBadge: {
    backgroundColor: '#E7EE71',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  capacityText: {
    fontSize: 14,
    color: '#423934',
    fontWeight: '500',
  },
  locationText: {
    fontSize: 14,
    color: '#655548',
    marginBottom: 8,
  },
  flairContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  flair: {
    backgroundColor: '#DAFC08',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  flairText: {
    fontSize: 12,
    color: '#423934',
    fontWeight: '500',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#8D7861',
  },
  joinButton: {
    backgroundColor: '#E15C11',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  joinButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tabBase: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 90,
  },
  tab1: {
    width: 115,
    marginLeft: 3,
  },
  tab2: {
    width: 170,
  },
  tab3: {
    width: 115,
    marginRight: 3,
  },
  activeTab: {
    backgroundColor: '#DAFC08',
  },
  pressedTab: {
    backgroundColor: '#DAFC08',
  },
  tabText: {
    fontSize: 14,
    color: '#8C8C8C',
  },
  activeTabText: {
    color: 'black',
    fontWeight: '500',
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  privateSearchContainer: {
    padding: 20,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,  // Reduced to make room for error text
    fontSize: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  inputError: {
    borderColor: '#E15C11',  // Orange border for errors
    backgroundColor: '#FFF8F6',  // Light orange background
  },
  errorText: {
    color: '#E15C11',
    fontSize: 14,
    marginBottom: 16,
    marginLeft: 4,
  },
  helperText: {
    color: '#666666',
    fontSize: 14,
    marginBottom: 16,
    marginLeft: 4,
  },
  joinButtonError: {
    backgroundColor: '#FFE4CC',  // Lighter orange for error state
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#423934',
    marginBottom: 16,
  },
  activeIcon: {
    tintColor: '#E15C11',
  },
});
