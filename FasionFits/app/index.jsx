import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react'
import { Redirect, useRouter } from 'expo-router';
import Start from './Start'

export default function index() {
  const router = useRouter();

  return (
    <View >
      <TouchableOpacity
          
          onPress={() => router.push('./Start')}
        >
          <Text >fuckjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj</Text>
        </TouchableOpacity>
    </View>
  )
}