import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../configs/firebase';
import { auth } from '../../configs/firebase';  

export default function Home() {
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    const fetchRecentlyViewed = async () => {
      const recentlyViewedCollection = collection(db, 'users', auth.currentUser?.uid, 'recentlyViewed');
      const snapshot = await getDocs(recentlyViewedCollection);
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setRecentlyViewed(productsData);
    };

    fetchRecentlyViewed();
  }, []);

  return (
    <ScrollView style={styles.container}>
      
      <View style={styles.helloSection}>
        <Text style={styles.helloText}>Welcome Back <Text style={styles.highlight}></Text>!</Text>
        <Text style={styles.tagline}>Discover trending fashion just for you.</Text>
      </View>

      
      <View style={styles.storiesSection}>
        <Text style={styles.sectionTitle}>Latest Stories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['New Arrivals', 'Summer Sale', 'Exclu Trends', 'Lookbook'].map((story, index) => (
            <TouchableOpacity key={index} style={styles.story}>
              <Image
                source={{ uri: 'https://via.placeholder.com/100' }}
                style={styles.storyImage}
              />
              <Text style={styles.storyText}>{story}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      
      <View style={styles.recentlyViewedSection}>
        <Text style={styles.sectionTitle}>Recently Viewed</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recentlyViewed.map((item) => (
            <View key={item.id} style={styles.productCard}>
              <Image
                source={{ uri: item.productImage }}
                style={styles.productImage}
              />
              <Text style={styles.productName}>{item.productName}</Text>
              <Text style={styles.productPrice}>${item.productPrice}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
  },
  helloSection: {
    marginTop: 35,
    marginBottom: 25,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 4, 
  },
  helloText: {
    fontSize: 23,
    fontWeight: '600',
    color: '#333',
  },
  highlight: {
    color: '#ff6b6b',
  },
  tagline: {
    fontSize: 16,
    color: '#888',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  storiesSection: {
    marginBottom: 30,
  },
  story: {
    alignItems: 'center',
    marginRight: 15,
  },
  storyImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#ff6b6b',
  },
  storyText: {
    fontSize: 14,
    color: '#444',
  },
  recentlyViewedSection: {
    marginBottom: 30,
  },
  productCard: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginRight: 20,
    padding: 10,
    elevation: 4,
  },
  productImage: {
    width: '100%',
    height: 160,
    borderRadius: 10,
  },
  productName: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productPrice: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ff6b6b',
  },
});
