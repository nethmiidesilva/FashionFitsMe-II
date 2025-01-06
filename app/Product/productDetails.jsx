import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useLocalSearchParams } from "expo-router";
import { db } from '../../configs/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function ProductDetails({ route }) {
  const navigation = useNavigation();
  const item = useLocalSearchParams();
  console.log(item.itemId);

  const [categories, setCategories] = useState([]);
  const [clothes, setClothes] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [isWishlisted, setWishlisted] = useState(false);
  const [isInCart, setInCart] = useState(false);

  // Fetch data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {

        const clothesCollection = collection(db, 'clothes');
        const clothesSnapshot = await getDocs(clothesCollection);
        const clothesData = clothesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setClothes(clothesData);
        console.log(clothesData);


      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Handle wishlist and cart actions
  const handleWishlist = () => {
    console.log(isWishlisted ? "Removing from Wishlist" : "Adding to Wishlist");
    setWishlisted(!isWishlisted);
  };

  const handleAddToCart = () => {
    console.log(isInCart ? "Removing from Cart" : "Adding to Cart");
    setInCart(!isInCart);
  };

  // Find the relevant product based on itemId
  const product = clothes.find(cloth => cloth.id === item.itemId);

  return (
    <ScrollView style={styles.container}>
      {product ? (
        <>
          <Image source={{ uri: product.imgUrl }} style={styles.productImage} />
          <View style={styles.detailsContainer}>
            <Text style={styles.productName}>{product.item} - {product.brand}</Text>
            <Text style={styles.productPrice}>${product.price}</Text>

            <View style={styles.detailsBox}>
              <Text style={styles.productDetails}>Size: <Text style={styles.highlight}>{product.size}</Text></Text>
              <Text style={styles.productDetails}>Color: <Text style={styles.highlight}>{product.color}</Text></Text>
              <Text style={styles.productDetails}>Material: <Text style={styles.highlight}>{product.material}</Text></Text>
              <Text style={styles.productDetails}>Stock Availability: <Text style={styles.highlight}>{product.stockAvailability}</Text></Text>
              <Text style={styles.productDetails}>Rating: <Text style={styles.highlight}>{product.ratings} ★</Text></Text>
              <Text style={styles.productDetails}>Created At: <Text style={styles.highlight}>{new Date(product.createdAt).toLocaleString()}</Text></Text>
            </View>

            <Text style={styles.productDescription}>{product.description}</Text>

            {/* Reviews Section */}
            {/* <View style={styles.reviewsContainer}>
              <Text style={styles.reviewsTitle}>Customer Reviews:</Text>
              {product.reviews.map((review, index) => (
                <View key={index} style={styles.reviewBox}>
                  <Text style={styles.reviewUsername}>{review.username}</Text>
                  <Text style={styles.reviewRating}>{review.rating} ★</Text>
                  <Text style={styles.reviewText}>{review.reviewText}</Text>
                  <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                </View>
              ))}
            </View> */}
          </View>

          {/* Floating action bar with icons */}
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleWishlist}
            >
              <Icon
                name="heart"
                size={24}
                color={isWishlisted ? '#ff6b6b' : '#fff'}
              />
              <Text style={styles.actionText}>Wishlist</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleAddToCart}
            >
              <Icon
                name="cart"
                size={24}
                color={isInCart ? '#008000' : '#fff'}
              />
              <Text style={styles.actionText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Text style={styles.productName}>Product not found</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  productImage: {
    width: '100%',
    height: 300,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  detailsContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  productName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginVertical: 8,
  },
  detailsBox: {
    marginVertical: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
  },
  productDetails: {
    fontSize: 16,
    color: '#555',
    marginVertical: 4,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#333',
  },
  productDescription: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    lineHeight: 22,
  },
  reviewsContainer: {
    marginTop: 20,
  },
  reviewsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  reviewBox: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  reviewUsername: {
    fontWeight: 'bold',
    color: '#333',
  },
  reviewRating: {
    color: '#ff6b6b',
  },
  reviewText: {
    color: '#666',
  },
  reviewDate: {
    color: '#999',
    fontSize: 12,
    marginTop: 5,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#333',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
  },
});
