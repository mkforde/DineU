import { Stack } from "expo-router";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { supabase } from '../lib/supabase';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';

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

    // Handle deep links
    const deepLinkSubscription = Linking.addEventListener('url', (event) => {
      // Parse the URL and handle authentication redirects
      const url = event.url;
      console.log('Received deep link:', url); // Add this for debugging
      
      if (url.includes('auth/callback')) {
        // Let the auth/callback.tsx route handle this
        return;
      } else if (url.includes('access_token') || url.includes('refresh_token')) {
        router.replace('/');
      }
    });

    return () => {
      subscription.unsubscribe();
      deepLinkSubscription.remove();
    };
  }, []);

  return (
    <Stack>
      <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="table" options={{ headerShown: false, title: "table" }} />
      <Stack.Screen name="location" options={{ headerShown: false, title: "location" }} />
      <Stack.Screen name="home" options={{ headerShown: false, title: "home" }} />
      <Stack.Screen name="profile" options={{ headerShown: false, title: "profile" }} />
      <Stack.Screen name="johnjaymeny" options={{ headerShown: false, title: "johnjaymenu" }} />
      <Stack.Screen name="jointable" options={{ headerShown: false, title: "jointable" }} />
      <Stack.Screen name="createtable" options={{ headerShown: false, title: "createtable" }} />
      <Stack.Screen name="CreateTableStep2" options={{ headerShown: false }}/>
      <Stack.Screen name="CreateTableStep3" options={{ headerShown: false }}/>
      <Stack.Screen name="GenerateTable" options={{ headerShown: false }}/>
      <Stack.Screen name="PrivateJohnJayLunch"options={{ headerShown: false }}/>


    </Stack>
  );
}
