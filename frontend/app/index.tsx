import { useEffect, useState } from "react";
import { View, Text } from "react-native";

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
  const [menuData, setMenuData] = useState<MenuApiResponse | null>(null);
  const [occupancyData, setOccupancyData] = useState<OccupancyApiResponse | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    const fetchData = async () => {
      try {
        // Fetch menu data
        const menuResponse = await fetch(MENU_API_URL);
        const menuResult = await menuResponse.json();
        if (isSubscribed) {
          console.log('Menu API Response:', menuResult);
          setMenuData(menuResult);
        }

        // Fetch occupancy data
        const occupancyResponse = await fetch(OCCUPANCY_API_URL);
        const occupancyResult = await occupancyResponse.json();
        if (isSubscribed) {
          console.log('Occupancy API Response:', occupancyResult);
          setOccupancyData(occupancyResult);
        }
      } catch (error) {
        console.error('API fetch error:', error);
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      isSubscribed = false;
    };
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <View>
      <Text>Check console for data</Text>
    </View>
  );
}
