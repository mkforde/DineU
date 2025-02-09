import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://eilgfvfxoaptkbqirdmj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpbGdmdmZ4b2FwdGticWlyZG1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMzMzNzksImV4cCI6MjA1NDYwOTM3OX0.ctCqhZDGK8l1Xb5cR8uhaBBjI7bWydAUF5iFN1QoxSs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}); 