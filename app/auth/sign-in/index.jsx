import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../configs/firebase';

export default function SignIn() {
  const navigation = useNavigation();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  const onSignIn = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log('User signed in:', user);
        router.push('/home');
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error('Error signing in:', errorCode, errorMessage);
      });
  };

  React.useEffect(() => {
    navigation.setOptions({
      headerShown: false, // Hides the header for a clean look
    });
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'white', padding: 24 }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 32, textAlign: 'center' }}>Login</Text>

      <View style={{ width: '100%', marginBottom: 16 }}>
        <TextInput
          style={{ width: '100%', padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 }}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={{ width: '100%', marginBottom: 16 }}>
        <TextInput
          style={{ width: '100%', padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 }}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View style={{ width: '100%', marginBottom: 24 }}>
        <TouchableOpacity onPress={onSignIn} style={{ width: '100%', padding: 12, backgroundColor: '#007bff', borderRadius: 8 }}>
          <Text style={{ textAlign: 'center', color: 'white', fontSize: 18 }}>Login</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => router.push('auth/forgot-password')}>
        <Text style={{ color: '#007bff', textAlign: 'center', marginBottom: 16 }}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('auth/signup')}>
        <Text style={{ color: '#007bff', textAlign: 'center' }}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}
