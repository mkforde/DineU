import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    async function handleAuth() {
      try {
        console.log('Auth params:', params);
        const { code } = params;

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code as string);

          if (error) {
            console.error('Error exchanging code:', error);
            router.replace('/login');
            return;
          }

          if (data.session) {
            console.log('Session established');
            router.replace('/home');
            return;
          }
        }

        console.log('No code found, redirecting to login');
        router.replace('/login');
      } catch (error) {
        console.error('Auth error:', error);
        router.replace('/login');
      }
    }

    handleAuth();
  }, [params]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Authenticating...</Text>
    </View>
  );
} 