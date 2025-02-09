import React, { useState, useEffect, useRef } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, TextInput, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

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

// Chat Room Component
const ChatRoom = ({ tableId, onClose }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableDetails, setTableDetails] = useState(null);
  const [userUni, setUserUni] = useState(null);  // Add state for user's UNI
  const scrollViewRef = useRef();

  // Add function to get user's UNI
  const getUserUni = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('uni')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      return profile?.uni;
    } catch (error) {
      console.error('Error getting user UNI:', error);
      return null;
    }
  };

  // Update useEffect to get UNI first
  useEffect(() => {
    const initialize = async () => {
      const uni = await getUserUni();
      console.log('Got UNI:', uni); // Debug log
      if (uni) {
        setUserUni(uni);
        await fetchTableDetails();
        await fetchMessages(); // Make sure this runs
      } else {
        alert('Could not get your UNI');
        onClose();
      }
    };

    initialize();

    // Set up real-time subscription
    const subscription = supabase
      .channel(`table_messages_${tableId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'table_messages',
        filter: `table_id=eq.${tableId}`
      }, (payload) => {
        console.log('New message received:', payload); // Debug log
        setMessages(current => [...current, payload.new]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [tableId]);

  // Update fetchMessages to properly order and join with profiles
  const fetchMessages = async () => {
    if (!userUni) return;
    
    try {
      console.log('Fetching messages for table:', tableId); // Debug log
      
      const { data: messages, error } = await supabase
        .from('table_messages')
        .select('*')  // Select all fields
        .eq('table_id', tableId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      console.log('Messages received:', messages); // Debug log
      setMessages(messages || []);

      // Mark as read in background
      await supabase.rpc('mark_messages_read', {
        p_table_id: tableId,
        p_uni: userUni
      });

    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Update sendMessage to use UNI
  const sendMessage = async () => {
    if (!message.trim() || !userUni) return;

    try {
      const { error } = await supabase.rpc('send_table_message', {
        p_table_id: tableId,
        p_sender_uni: userUni,
        p_message: message.trim()
      });

      if (error) throw error;
      setMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  // Add function to fetch table details
  const fetchTableDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('dining_tables')
        .select(`
          *,
          table_interests (
            interest:interests (
              name
            )
          )
        `)
        .eq('id', tableId)
        .single();

      if (error) throw error;
      setTableDetails(data);
    } catch (error) {
      console.error('Error fetching table details:', error);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.chatModal}>
          <View style={styles.chatHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={onClose}
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>

            <View style={styles.groupInfo}>
              <Image 
                source={require("../assets/images/group_icon.png")}
                style={styles.groupIcon}
              />
              <View style={styles.groupTextInfo}>
                <Text style={styles.groupName}>{tableDetails?.table_name || 'Table Chat'}</Text>
                <View style={styles.topicsContainer}>
                  {tableDetails?.table_interests?.map((ti, index) => (
                    <View key={`topic-${index}`} style={styles.topicTag}>
                      <Text style={styles.topicText}>{ti.interest.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>

          <ScrollView 
            style={styles.chatContainer}
            ref={scrollViewRef}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg) => (
              <View 
                key={`msg-${msg.id}`} 
                style={[
                  styles.messageContainer,
                  msg.sender_uni === userUni && styles.myMessageContainer
                ]}
              >
                <View style={[
                  styles.messageContent,
                  msg.sender_uni === userUni && styles.myMessageContent
                ]}>
                  <View style={styles.messageHeader}>
                    <Text style={[
                      styles.senderName,
                      msg.sender_uni === userUni && styles.myMessageText
                    ]}>
                      {msg.sender_uni}
                    </Text>
                    <Text style={[
                      styles.messageTime,
                      msg.sender_uni === userUni && styles.myMessageText
                    ]}>
                      {new Date(msg.created_at).toLocaleTimeString()}
                    </Text>
                  </View>
                  <Text style={[
                    styles.messageText,
                    msg.sender_uni === userUni && styles.myMessageText
                  ]}>
                    {msg.message}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
          >
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={message}
                onChangeText={setMessage}
                placeholder="Type a message..."
                placeholderTextColor="#8D7861"
                multiline
                maxLength={500}
              />
              <TouchableOpacity 
                style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
                onPress={sendMessage}
                disabled={!message.trim()}
              >
                <Image 
                  source={require("../assets/images/send.png")} 
                  style={styles.sendIcon}
                />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
};

export default function WelcomeScreen() {
  const { height } = useWindowDimensions();
  const navigation = useNavigation();
  const [userTables, setUserTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeChatId, setActiveChatId] = useState(null);

  // Fetch user's tables
  const fetchUserTables = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('No user session found');
        alert('Please sign in to view your tables');
        return;
      }

      // First get the user's UNI from their profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('uni')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw profileError;
      }

      if (!profile?.uni) {
        console.log('No UNI found for user');
        alert('Please update your profile with your UNI');
        return;
      }

      console.log('Fetching tables for UNI:', profile.uni);
      const { data, error } = await supabase.rpc('get_user_tables', {
        p_uni: profile.uni  // Use UNI instead of auth ID
      });

      if (error) {
        console.error('Error from get_user_tables:', error);
        throw error;
      }

      console.log('Tables returned:', data);
      setUserTables(data || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
      alert('Failed to load your tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTables();

    const subscription = supabase
      .channel('table_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'table_messages'
      }, () => {
        fetchUserTables();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <View style={styles.body}>
      <View style={styles.container}>
        <ScrollView style={{ height: height - 82 }}>
          <View style={styles.top}>
            <Text style={styles.title}>Tables</Text>
          </View>

          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.navigate("createtable")}>
              <Image source={require("../assets/images/create table.png")}/>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate("jointable")}>
              <Image source={require("../assets/images/join table.png")}/>
            </TouchableOpacity>
          </View>

          <View style={styles.tableChatsSection}>
            <Text style={styles.notif}>Table Chats</Text>
            <View style={styles.chatsContainer}>
              {loading ? (
                <Text>Loading your tables...</Text>
              ) : userTables.length === 0 ? (
                <Text>You haven't joined any tables yet</Text>
              ) : (
                userTables.map((table) => (
                  <TableChatPreview
                    key={`table-${table.table_id}-${table.created_at}`}
                    title={table.table_name}
                    lastMessage={table.last_message || 'No messages yet'}
                    time={table.last_message_time ? 
                      new Date(table.last_message_time).toLocaleTimeString() : 
                      'New table'
                    }
                    unreadCount={table.unread_count}
                    isPrivate={table.privacy === 'private'}
                    isOwner={table.is_owner}
                    onPress={() => setActiveChatId(table.table_id)}
                  />
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </View>
      
      {activeChatId && (
        <ChatRoom 
          tableId={activeChatId} 
          onClose={() => setActiveChatId(null)}
        />
      )}
      
      <CustomBottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  bottom: {
    height: 82,
    width: 394,
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
    width: 394,
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
  chatModal: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 50,
    width: 394,
    alignSelf: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  closeButton: {
    fontSize: 24,
    marginRight: 15,
    color: '#666666',
  },
  messagesContainer: {
    flex: 1,
    padding: 15,
  },
  messageWrapper: {
    marginBottom: 15,
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 8,
  },
  messageSender: {
    fontWeight: '600',
    color: '#423934',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#423934',
  },
  messageTime: {
    fontSize: 12,
    color: '#655548',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    width: 394,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#E15C11',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  ownerChatOverlay: {
    backgroundColor: '#FFE4CC',  // Light orange background for owned tables
  },
  ownerBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#E15C11',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ownerBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
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
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    width: 394,
    paddingHorizontal: 15,
  },
  messageContent: {
    flex: 1,
    backgroundColor: "#E7EE71",
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
  textInput: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 12,
    borderRadius: 24,
    maxHeight: 100,
    fontSize: 14,
    color: "#423934",
  },
  sendIcon: {
    width: 20,
    height: 20,
    tintColor: "#FFFFFF",
  },
  sendButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  myMessageContent: {
    backgroundColor: '#DAFC08',
    borderTopRightRadius: 0,
    borderTopLeftRadius: 12,
  },
  myMessageText: {
    color: '#423934',
  },
});