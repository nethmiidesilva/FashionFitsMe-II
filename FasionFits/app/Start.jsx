import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';

export default function Start() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View>
      <Image
        source={require('./../assets/images/ffmlogo1.png')}
        style={{ width: '100%', height: 400 }}
      />
      </View>

      <View>
      <Text style={styles.title}>FashionFitsMe</Text>
      <Text style={styles.subtitle}>
      Discover tomorrow's trends today at FashionFitsMe
        </Text>
      </View>
      
      <View style={styles.innerContainer}>        

        <TouchableOpacity
          style={[styles.button]}
          onPress={() => router.push('auth/sign-up/')}
        >
          <Text style={styles.buttonText}>Let's get started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          
          onPress={() => router.push('auth/sign-in/')}
        >
          <Text style={[styles.textstyle1]}>I already have an account</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
  },
  innerContainer: {
    marginTop: 0,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    color: '#A9A9A9',
    marginTop:10,
    paddingHorizontal:20,
  },
  button: {
    width: '60%',
    paddingVertical: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4, // Adds shadow for Android
    shadowColor: '#000', // Adds shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    backgroundColor: '#4285F4',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  googleButton: {
     // Google blue color
  },
  textstyle1: {
     color:'blue',// Green color for sign in
  },
});
