import { Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, View } from 'react-native'
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'expo-router'

const index = () => {
  const router = useRouter();
  const [uni, setUni] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Listen for auth state changes
  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.replace('/home');
      }
    });
  }, []);

  const isValidUNI = (uni: string) => {
    // Matches 2-3 letters followed by 4 digits (e.g., ma4368)
    const uniRegex = /^[a-zA-Z]{2,3}\d{4}$/;
    return uniRegex.test(uni);
  };

  const sendSignInLink = async () => {
    setError('');
    if (!isValidUNI(uni)) {
      setError('Please enter a valid UNI (e.g., ma4368)');
      return;
    }

    setLoading(true);
    try {
      const email = `${uni}@columbia.edu`;
      console.log('Attempting to send OTP to:', email);

      // Only send login link
      const { data, error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: 'http://localhost:8081/home'
        }
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      setUni('');
      alert(`Sign-in link sent to ${email}`);
    } catch (error: any) {
      console.error('Caught error:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Columbia Login</Text>
      <Text style={styles.subtitle}>Enter your UNI to sign in</Text>
      
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.textInput} 
          placeholder="UNI (e.g., ma4368)" 
          value={uni} 
          onChangeText={setUni}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.emailSuffix}>@columbia.edu</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={sendSignInLink}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.text}>Send Sign-in Link</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 10,
    color: '#1A237E',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    marginBottom: 5,
  },
  textInput: {
    flex: 1,
    height: 50,
    backgroundColor: '#FFFFFF',
    borderColor: '#E8EAF6',
    borderWidth: 2,
    borderRadius: 15,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#3C4858',
    shadowColor: '#9E9E9E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  emailSuffix: {
    marginLeft: 10,
    color: '#666',
    fontSize: 16,
  },
  error: {
    color: '#D32F2F',
    marginTop: 5,
    marginBottom: 15,
    fontSize: 14,
  },
  button: {
    width: '90%',
    height: 50,
    backgroundColor: '#1A237E',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  }
});

export default index;
