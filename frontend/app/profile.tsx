import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  useWindowDimensions,
  Alert
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface UserProfile {
  firstName: string;
  lastName: string;
  uni: string;
  email: string;
  avatar?: string;
}

function CustomBottomNav() {
  const [activeTab, setActiveTab] = useState("profile");
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

export default function ProfileScreen() {
  const { height } = useWindowDimensions();
  const navigation = useNavigation();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigation.navigate('login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.clear(); // Clear all stored data
      navigation.navigate('login');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('editProfile', { profile: userProfile });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
  <View style = {styles.outercontainer}>
    <View style={styles.container}>
      <ScrollView style={{ height: height - 82 }}>
        {/* Profile Header */}
        <View style={styles.header}>
          <Image 
            source={require("../assets/images/Animal Avatar.png")}
            style={styles.avatar}
          />
          <Text style={styles.name}>
            {userProfile?.firstName} {userProfile?.lastName}
          </Text>
          <Text style={styles.uni}>{userProfile?.uni}</Text>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="person-outline" size={24} color="#423934" style={styles.menuIcon} />
              <Text style={styles.menuText}>Edit profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#8D7861" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('security')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="shield-outline" size={24} color="#423934" style={styles.menuIcon} />
              <Text style={styles.menuText}>Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#8D7861" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('notifications')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="notifications-outline" size={24} color="#423934" style={styles.menuIcon} />
              <Text style={styles.menuText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#8D7861" />
          </TouchableOpacity>
        </View>

        {/* Cache & Storage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cache & cellular</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('storage')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="folder-outline" size={24} color="#423934" style={styles.menuIcon} />
              <Text style={styles.menuText}>Free up space</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#8D7861" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('dataSaver')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="cellular-outline" size={24} color="#423934" style={styles.menuIcon} />
              <Text style={styles.menuText}>Data Saver</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#8D7861" />
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('report')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="flag-outline" size={24} color="#423934" style={styles.menuIcon} />
              <Text style={styles.menuText}>Report a problem</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#8D7861" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="log-out-outline" size={24} color="#E15C11" style={styles.menuIcon} />
              <Text style={[styles.menuText, styles.signOutText]}>Sign out</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>DINE U v1.0.234.567</Text>
      </ScrollView>
      <CustomBottomNav />
    </View>
  </View>
  );
}

const styles = StyleSheet.create({
  outercontainer: {
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#FDFECC",
    width: 394,
    
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#423934',
    marginBottom: 5,
  },
  uni: {
    fontSize: 16,
    color: '#8D7861',
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#423934',
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#423934',
  },
  arrowIcon: {
    width: 20,
    height: 20,
  },
  signOutText: {
    color: '#E15C11',
  },
  version: {
    textAlign: 'center',
    color: '#8D7861',
    padding: 20,
    fontSize: 12,
  },
  bottom: {
    height: 82,
    width: 394,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  }
});
