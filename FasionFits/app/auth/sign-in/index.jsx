import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Animated } from 'react-native';
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
        router.push('./../../loading');
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error('Error signing in:', errorCode, errorMessage);
      });
  };

  useEffect(() => {
    navigation.setOptions({
      headerShown: false, // Hides the header for a clean look
    });

    // Animate inputs and button
    Animated.stagger(100, [
      Animated.timing(emailAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(passwordAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <View style={tw`flex-1 justify-center bg-white p-6`}>
      <Text style={tw`text-3xl font-bold mb-8 text-center`}>Login</Text>

      <Animated.View style={[tw`w-full mb-4`, { opacity: emailAnim, transform: [{ scale: emailAnim }] }]}>
        <TextInput
          style={tw`w-full p-3 border border-gray-300 rounded-md`}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </Animated.View>

      <Animated.View style={[tw`w-full mb-4`, { opacity: passwordAnim, transform: [{ scale: passwordAnim }] }]}>
        <TextInput
          style={tw`w-full p-3 border border-gray-300 rounded-md`}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </Animated.View>

      <Animated.View style={[tw`w-full mb-6`, { opacity: buttonAnim, transform: [{ scale: buttonAnim }] }]}>
        <TouchableOpacity onPress={onSignIn} style={tw`w-full p-3 bg-blue-500 rounded-md`}>
          <Text style={tw`text-center text-white text-lg`}>Login</Text>
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity onPress={() => router.push('auth/forgot-password')}>
        <Text style={tw`text-blue-500 text-center mb-4`}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('auth/signup')}>
        <Text style={tw`text-blue-500 text-center`}>Don't have an account? Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}
