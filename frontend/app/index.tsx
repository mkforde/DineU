import React, { useEffect } from "react";
import { View, Text, Image, StyleSheet, ImageBackground, TouchableOpacity } from "react-native";
import { useRouter } from 'expo-router';
import { auth } from '../config/firebase';
import { supabase } from '../lib/supabase';

export default function WelcomeScreen() {
  const router = useRouter();

  useEffect(() => {
    if (!router) return; // Early return if router isn't ready

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      router.replace(session ? '/home' : '/login');
    };
    checkAuth();
  }, [router]);

  const handleExplore = () => {
    if (!auth.currentUser) {
      router.push({ pathname: '/login' });
    } else {
      router.push({ pathname: '/home' });
    }
  };

  return null; // Return null while checking auth
}

const styles = StyleSheet.create({
  body: {
    width: "100%",
    alignItems: "center",
    flex: 1,
    fontFamily: "Helvetica",
  },
  container: {
    flex: 1,
    backgroundColor: "#FDFECC",
    padding: 20,
    width: 393,
  },
  background: {
    top: 55,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
  },
  imageW: {
    height: 4,
    width: 55.25,
  },
  skip: {
    fontSize: 14,
    color: "#8D7861",
    fontWeight: "bold",
  },
  content: {
    alignItems: "center",
    marginVertical: 20,
  },
  title: {
    fontSize: 40,
    fontWeight: "900",
    color: "rgba(66, 57, 52, 1)",
    top: 100,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "rgba(101, 85, 72, 1)",
    marginTop: 10,
    fontWeight: "medium",
    fontStyle: "italic",
    top: 100,
  },
  imageContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
  button: {
    backgroundColor: "rgba(101, 85, 72, 1)",
    paddingVertical: 15,
    borderRadius: 14.92,
    alignItems: "center",
    marginBottom: 30,
    width: 246.5,
    height: 54.78,
  },
  buttonDiv: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 20.89,
    color: "#FDFF7D",
    fontWeight: "bold",
  },
});
