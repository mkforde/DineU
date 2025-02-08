import React from "react";
import { useEffect, useState } from "react";
import { View, Image, StyleSheet, ImageBackground, TouchableOpacity, Text } from "react-native";
import { useRouter } from 'expo-router';
import { auth } from '../config/firebase';

type MenuItem = {
  mealType: string;
  diningHall: string;
  hours: string;
  foodType: string;
  foodName: string;
};

type MenuData = {
  breakfast: MenuItem[];
  lunch: MenuItem[];
  dinner: MenuItem[];
  latenight: MenuItem[];
};

type MenuApiResponse = {
  success: boolean;
  data: MenuData;
  timestamp: string;
};

type OccupancyData = {
  percentageFull: number;
  capacity: number | null;
  lastUpdated: string;
  isActive: boolean;
  status: 'available' | 'unavailable' | 'error';
  message?: string;
};

type OccupancyApiResponse = {
  success: boolean;
  data: Record<string, OccupancyData>;
  error?: string;
  timestamp: string;
};

const MENU_API_URL = 'http://localhost:3000/api/menu';
const OCCUPANCY_API_URL = 'http://localhost:3000/api/occupancy';

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Edit app/index.tsx to edit this screen.</Text>
    </View>
  );
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
