import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: true }} />
      <Stack.Screen name="home" options={{ headerShown: true, title: "Home" }} />
    </Stack>
  );
}
