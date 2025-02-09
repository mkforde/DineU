import React from "react";
import { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Animated  } from "react-native";
import { useNavigation } from '@react-navigation/native';

export function Selection() {
  const [activeTab, setActiveTab] = useState(0);
  const [pressedTab, setPressedTab] = useState(null);

  // Animation value for press feedback
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
    setActiveTab(index);
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
    <View style={styles.container}>
      {['Private','Public'].map((label, index) => (
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

const TableChatPreview = ({ title, lastMessage, time, unreadCount, isPrivate }) => (
  <TouchableOpacity style={[
    styles.chatPreview,
    isPrivate && styles.privateChatOverlay
  ]}>
    <View style={styles.chatImageContainer}>
      <Image source={require("../assets/images/group_icon.png")} style={styles.tableIcon} />
      {isPrivate && (
        <View style={styles.lockContainer}>
          <Image 
            source={require("../assets/images/Lock.png")} 
            style={styles.lockIcon}
          />
        </View>
      )}
    </View>
    <View style={styles.chatInfo}>
      <Text style={styles.chatTitle}>{title}</Text>
      <Text style={styles.lastMessage} numberOfLines={1}>{lastMessage}</Text>
    </View>
    <View style={styles.chatMeta}>
      <Text style={styles.timeText}>{time}</Text>
      {unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{unreadCount}</Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
);

export default function WelcomeScreen() {
  const { height } = useWindowDimensions();

  // Sample data for table chats
  const sampleTableChats = [
    {
      id: 1,
      title: "Private John Jay Lunch",
      lastMessage: "Password is jj2024",
      time: "2m ago",
      unreadCount: 3,
      isPrivate: true
    },
    {
      id: 2,
      title: "Secret Ferris Squad",
      lastMessage: "Don't forget the secret knock",
      time: "15m ago",
      unreadCount: 0,
      isPrivate: true
    },
    {
      id: 3,
      title: "JJ's Place Open Table",
      lastMessage: "Anyone can join!",
      time: "1h ago",
      unreadCount: 5,
      isPrivate: false
    },
    {
      id: 4,
      title: "Public Dinner Group",
      lastMessage: "Meeting at 6pm today",
      time: "2h ago",
      unreadCount: 0,
      isPrivate: false
    }
  ];

  // Sort chats to put private ones first
  const sortedChats = [...sampleTableChats].sort((a, b) => {
    if (a.isPrivate === b.isPrivate) return 0;
    return a.isPrivate ? -1 : 1;
  });

  return (
    <View style={styles.body}>
      <View style={styles.container}>
        <ScrollView style={{ height: height - 82 }}>
          <View style={styles.top}>
            <Text style={styles.title}>Join a table</Text>
          </View>
          <Selection></Selection>


          <View style={styles.tableChatsSection}>
            <Text style={styles.notif}>Table Chats</Text>
            <View style={styles.chatsContainer}>
              {sortedChats.map(chat => (
                <TableChatPreview
                  key={chat.id}
                  title={chat.title}
                  lastMessage={chat.lastMessage}
                  time={chat.time}
                  unreadCount={chat.unreadCount}
                  isPrivate={chat.isPrivate}
                />
              ))}
            </View>
          </View>
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
  }
});