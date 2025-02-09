import React, { useState } from "react";
import { 
  View, Text, Image, StyleSheet, TouchableOpacity, 
  ScrollView, useWindowDimensions, Animated, TextInput 
} from "react-native";
import { useNavigation } from '@react-navigation/native';

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

// New component for private table search
const PrivateTableSearch = () => {
  const [pin, setPin] = useState('');
  const [tableId, setTableId] = useState('');

  return (
    <View style={styles.privateSearchContainer}>
      <Text style={styles.sectionTitle}>Enter Private Table Details</Text>
     
      <TextInput 
        style={styles.input}
        placeholder="PIN Code"
        value={pin}
        onChangeText={setPin}
        keyboardType="numeric"
        secureTextEntry
        maxLength={4}
      />
      <TouchableOpacity style={styles.joinButton}>
        <Text style={styles.joinButtonText}>Join Private Table</Text>
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
    onPress={onPress}
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
  const [activeTab, setActiveTab] = useState(0); // 0: Private, 1: Public
  const navigation = useNavigation();

  // Sample data with topics and capacity
  const sampleTableChats = [
    {
      id: 1,
      title: "JJ's Place Dinner",
      location: "JJ's Place",
      topics: ["Sports", "Casual", "First-Years"],
      currentSize: 3,
      maxCapacity: 6,
      time: "Starting in 30min"
    },
    {
      id: 2,
      title: "International Students",
      location: "Ferris Booth",
      topics: ["International", "Cultural", "Language Exchange"],
      currentSize: 4,
      maxCapacity: 8,
      time: "Starting in 1h"
    },
    {
      id: 3,
      title: "CS Study Group",
      location: "John Jay",
      topics: ["Academic", "Computer Science", "Study Group"],
      currentSize: 2,
      maxCapacity: 4,
      time: "Starting now"
    }
  ];

  const handleJoinTable = (tableId) => {
    // Handle joining the table
    const table = sampleTableChats.find(t => t.id === tableId);
    if (table && table.currentSize < table.maxCapacity) {
      console.log(`Joining table ${tableId}`);
      // Navigate to table chat or show join confirmation
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
                {sampleTableChats.map(chat => (
                  <TableChatPreview
                    key={chat.id}
                    {...chat}
                    onPress={() => handleJoinTable(chat.id)}
                  />
                ))}
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
    marginBottom: 16,
    fontSize: 16,
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
