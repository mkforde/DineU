import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: true }} />
      <Stack.Screen name="table" options={{ headerShown: true, title: "table" }} />
      <Stack.Screen name="nutrition" options={{ headerShown: true, title: "nutrition" }} />
      <Stack.Screen name="home" options={{ headerShown: true, title: "home" }} />
      <Stack.Screen name="profile" options={{ headerShown: true, title: "profile" }} />
      <Stack.Screen name="johnjaymeny" options={{ headerShown: true, title: "johnjaymenu" }} />

    </Stack>
  );
}
