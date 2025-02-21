import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';

export default function Start() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={require('./../assets/images/ffmlogo1.png')}
        style={styles.logo}
      />

      <Text style={styles.title}>FashionFitsMe</Text>
      <Text style={styles.subtitle}>
        Discover tomorrow's trends today at FashionFitsMe
      </Text>
      
      <View style={styles.buttonContainer}>        
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('auth/sign-up/')}
        >
          <Text style={styles.buttonText}>Let's get started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('auth/sign-in/')}
        >
          <Text style={styles.linkText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  logo: {
    width: '80%',
    height: 250,
    resizeMode: 'contain',
    marginBottom: 30,
  },
  title: {
    fontSize: 30,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#7E7E7E',
    textAlign: 'center',
    paddingHorizontal: 10,
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '80%',
    paddingVertical: 15,
    borderRadius: 8,
    backgroundColor: '#1A73E8',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: '#1A73E8',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
});
