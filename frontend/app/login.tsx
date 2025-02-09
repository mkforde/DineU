import { Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, View, Alert } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'

const index = () => {
  const router = useRouter();
  const [uni, setUni] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const isValidUNI = (uni: string) => {
    // Matches 2-3 letters followed by 4 digits (e.g., ma4368)
    const uniRegex = /^[a-zA-Z]{2,3}\d{4}$/;
    return uniRegex.test(uni);
  };

  const signInWithEmail = async () => {
    if (!isValidUNI(uni)) {
      setError('Please enter a valid UNI');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      if (!otpSent) {
        // Request OTP
        const { error: signInError } = await supabase.auth.signInWithOtp({
          email: `${uni}@columbia.edu`,
        });

        if (signInError) throw signInError;
        
        setOtpSent(true);
        Alert.alert('Check your email', 'We sent you a 6-digit code to verify your email');
      } else {
        // Verify OTP
        const { error: verifyError } = await supabase.auth.verifyOtp({
          email: `${uni}@columbia.edu`,
          token: otp,
          type: 'email'
        });

        if (verifyError) throw verifyError;
        
        router.replace('/home');
      }
    } catch (error) {
      setError(error.message);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

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

      {otpSent && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter 6-digit code"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={signInWithEmail}
        disabled={loading}
      >
        <Text style={styles.text}>
          {loading ? 'Loading...' : otpSent ? 'Verify Code' : 'Send Code'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

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
