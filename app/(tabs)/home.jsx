import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../configs/firebase';
import { useRouter } from 'expo-router';
import { auth } from '../../configs/firebase';

const { width } = Dimensions.get('window');

export default function Home() {
  const [clothes, setClothes] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const flatListRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clothesCollection = collection(db, 'clothes');
        const snapshot = await getDocs(clothesCollection);
        const clothesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClothes(clothesData);

        const recentlyViewedCollection = collection(db, 'users', auth.currentUser?.uid, 'recentlyViewed');
        const recentSnapshot = await getDocs(recentlyViewedCollection);
        const productsData = recentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecentlyViewed(productsData);
      } catch (error) {
        console.error("Error fetching data: ", error);
      }
    };

    fetchData();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.helloSection}>
        <Text style={styles.helloText}>Welcome Back!</Text>
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

      <View style={styles.carouselSection}>
        <Text style={styles.sectionTitle}>Clothes Collection</Text>
        <FlatList
          data={clothes}
          horizontal
          ref={flatListRef}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.productCard} 
              onPress={() => router.push({
                pathname: 'Product/productDetails',
                params: { itemId: item.id },
              })}
            >
              <Image 
                source={{ uri: item.imgUrl || 'https://via.placeholder.com/150' }} 
                style={styles.productImage} 
              />
              <Text style={styles.productName}>{item.item || 'Unknown Item'}</Text>
              <Text style={styles.productPrice}>${item.id || '0.00'}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          snapToAlignment="start"
          decelerationRate="fast"
          snapToInterval={(width - 40) / 2} 
        />
      </View>

      <View style={styles.recentlyViewedSection}>
        <Text style={styles.sectionTitle}>Recently Viewed</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recentlyViewed.map((item) => (
            <View key={item.id} style={styles.productCard}>
              <Image
                source={{ uri: item.productImage || 'https://via.placeholder.com/150' }}
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
    padding: 20,
    backgroundColor: '#fff',
  },
  helloSection: {
    marginBottom: 20,
  },
  helloText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tagline: {
    fontSize: 16,
    color: '#666',
  },
  storiesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
  },
  productCard: {
    marginRight: 10,
    width: (width - 40) / 2,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
    padding: 10,
  },
  productImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
  },
  productName: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: 'bold',
  },
  productPrice: {
    fontSize: 14,
    color: '#333',
  },
  story: {
    marginRight: 10,
    alignItems: 'center',
  },
  storyImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  storyText: {
    marginTop: 5,
    fontSize: 14,
  },
  recentlyViewedSection: {
    marginBottom: 30,
  },
});
