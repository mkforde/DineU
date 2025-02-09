import React, { useState } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { useNavigation } from '@react-navigation/native';

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

export default function GroupChat() {
  const navigation = useNavigation();
  const [messageText, setMessageText] = useState('');

  // Sample chat messages data
  const messages = [
    {
      id: 1,
      sender: "Alex",
      message: "Hey everyone! Just got here, sitting near the window",
      time: "12:30 PM",
      avatar: require("../assets/images/Avatar1.png")
    },
    {
      id: 2,
      sender: "Sarah",
      message: "I'll be there in 5!",
      time: "12:31 PM",
      avatar: require("../assets/images/Avatar2.png")
    },
    {
      id: 3,
      sender: "Mike",
      message: "Can someone grab an extra fork for me?",
      time: "12:33 PM",
      avatar: require("../assets/images/Avatar3.png")
    },
    {
      id: 4,
      sender: "Emma",
      message: "Already here, saved spots for everyone",
      time: "12:34 PM",
      avatar: require("../assets/images/Avatar4.png")
    }
  ];

  // Topics/Interests for the group
  const topics = ["Chill & Casual", "Foodies & Chefs", "STEM & Tech Talk"];

  const handleSendMessage = () => {
    if (messageText.trim().length > 0) {
      // Add logic to send message
      setMessageText(''); // Clear input after sending
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image 
            source={require("../assets/images/backsymb.png")}
            style={styles.backIcon}
          />
        </TouchableOpacity>

        <View style={styles.groupInfo}>
          <Image 
            source={require("../assets/images/group_icon.png")}
            style={styles.groupIcon}
          />
          <View style={styles.groupTextInfo}>
            <Text style={styles.groupName}>Private John Jay Lunch</Text>
            <View style={styles.topicsContainer}>
              {topics.map((topic, index) => (
                <View key={index} style={styles.topicTag}>
                  <Text style={styles.topicText}>{topic}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Chat Messages */}
      <ScrollView style={styles.chatContainer}>
        {messages.map((message) => (
          <View key={message.id} style={styles.messageContainer}>
            <Image source={message.avatar} style={styles.avatar} />
            <View style={styles.messageContent}>
              <View style={styles.messageHeader}>
                <Text style={styles.senderName}>{message.sender}</Text>
                <Text style={styles.messageTime}>{message.time}</Text>
              </View>
              <Text style={styles.messageText}>{message.message}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
          placeholderTextColor="#8D7861"
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!messageText.trim()}
        >
          <Image 
            source={require("../assets/images/send.png")} 
            style={styles.sendIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFECC",
    width: 394,
    alignSelf: 'center',
  },
  header: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    paddingTop: 35,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    width: 394,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 8,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: "#423934",
  },
  groupInfo: {
    flexDirection: "row",
    alignItems: "center",
    width: '100%',
  },
  groupIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  groupTextInfo: {
    flex: 1,
    maxWidth: 300,
  },
  groupName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#423934",
    marginBottom: 4,
  },
  topicsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  topicTag: {
    backgroundColor: "#E15C11",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 4,
  },
  topicText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  chatContainer: {
    flex: 1,
    padding: 16,
    width: 394,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    width: '100%',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    borderTopLeftRadius: 0,
    maxWidth: 300,
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  senderName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#423934",
  },
  messageTime: {
    fontSize: 12,
    color: "#8D7861",
  },
  messageText: {
    fontSize: 14,
    color: "#423934",
  },
  inputContainer: {
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    width: 394,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 24,
    maxHeight: 100,
    fontSize: 14,
    color: "#423934",
  },
  sendButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E15C11",
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  sendIcon: {
    width: 20,
    height: 20,
    tintColor: "#FFFFFF",
  }
});