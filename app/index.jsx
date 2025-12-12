import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import Start from './Start'
import React, { useState,useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { LogBox } from 'react-native';

export default function index() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  

// Ignore all log notifications (warnings)
LogBox.ignoreAllLogs(true);
  useEffect(() => {
    const auth = getAuth();

    // Listen for user state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // null if not signed in
    });

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, []);

  return (
    <View style={{ flex: 1 }}>
    {user? <Redirect href={'/home'}/>:<Start/>}
  </View>
  )
}