import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../configs/firebase';

export default function Signup() {
  const router = useRouter();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUserName] = useState('');

  const onCreateAccount = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log('User signed up:', user);
        router.push('auth/sign-in');
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error('Error signing up:', errorCode, errorMessage);
      });
  };

  React.useEffect(() => {
    navigation.setOptions({
      headerShown: false
    });
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'white', padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' }}>Create Account</Text>

      <View style={{ width: '100%', marginBottom: 16 }}>
        <TextInput
          style={{ width: '100%', padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 }}
          placeholder="Username"
          value={username}
          onChangeText={setUserName}
        />
      </View>

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

      <View style={{ width: '100%', marginBottom: 24 }}>
        <TextInput
          style={{ width: '100%', padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 }}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <View style={{ width: '100%', marginBottom: 16 }}>
        <TouchableOpacity
          style={{ width: '100%', padding: 12, backgroundColor: '#007bff', borderRadius: 8 }}
          onPress={onCreateAccount}
        >
          <Text style={{ textAlign: 'center', color: 'white', fontSize: 18 }}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => router.push('auth/terms-conditions')}>
        <Text style={{ color: '#007bff', textAlign: 'center', marginBottom: 16 }}>Read Terms and Conditions</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('auth/sign-in')}>
        <Text style={{ color: '#007bff', textAlign: 'center' }}>Already have an account? Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}
