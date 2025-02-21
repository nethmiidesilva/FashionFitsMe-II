import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../configs/firebase';
import { useRouter } from 'expo-router';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const router = useRouter();

  const onResetPassword = () => {
    sendPasswordResetEmail(auth, email)
      .then(() => {
        Alert.alert('Password Reset', 'Check your email to reset your password.');
        router.push('../auth/sign-in'); // Navigate back to the SignIn screen
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        Alert.alert('Error', errorMessage);
        console.error('Error resetting password:', errorCode, errorMessage);
      });
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'white', padding: 24 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 32, textAlign: 'center' }}>
        Reset Password
      </Text>

      <View style={{ width: '100%', marginBottom: 16 }}>
        <TextInput
          style={{ width: '100%', padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 }}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <TouchableOpacity onPress={onResetPassword} style={{ width: '100%', padding: 12, backgroundColor: '#007bff', borderRadius: 8 }}>
        <Text style={{ textAlign: 'center', color: 'white', fontSize: 18 }}>Send Reset Link</Text>
      </TouchableOpacity>
    </View>
  );
}
