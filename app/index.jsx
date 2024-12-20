import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react'
import { Redirect, useRouter } from 'expo-router';
import Start from './Start'
import { auth } from '../configs/firebase';

export default function index() {
  const user = auth.currentUser;
  const router = useRouter();

  return (
    <View style={{ flex: 1 }}>
    {user? <Redirect href={'/home'}/>:<Start/>}
  </View>
  )
}