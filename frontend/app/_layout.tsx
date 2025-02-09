import { Stack } from "expo-router";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Check for existing session on app load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/home');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        router.replace('/home');
      } else if (event === 'SIGNED_OUT') {
        router.replace('/');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: true }} />
      <Stack.Screen name="table" options={{ headerShown: true, title: "table" }} />
      <Stack.Screen name="nutrition" options={{ headerShown: true, title: "nutrition" }} />
      <Stack.Screen name="home" options={{ headerShown: true, title: "home" }} />
      <Stack.Screen name="profile" options={{ headerShown: true, title: "profile" }} />
      <Stack.Screen name="johnjaymeny" options={{ headerShown: true, title: "johnjaymenu" }} />
      <Stack.Screen name="jointable" options={{ headerShown: true, title: "jointable" }} />
      <Stack.Screen name="createtable" options={{ headerShown: true, title: "createtable" }} />


    </Stack>
  );
}
