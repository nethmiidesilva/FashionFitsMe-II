import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function ProductDetails() {
  const navigation = useNavigation();

  // Updated hardcoded product data with new fields
  const product = {
    brand: "Brand 1",
    color: "Blue",
    createdAt: "2024-10-28T22:26:35.893Z",
    imgUrl: "https://via.placeholder.com/300?text=Clothes+1",
    item: "Blue Denim Jacket",
    material: "Denim",
    price: "75.99",
    size: "M",
    description: "Stylish and comfortable denim jacket for casual outings.",
    stockAvailability: 10,
    ratings: 4.5,
    reviews: [
      {
        username: "john_doe",
        reviewText: "Excellent quality and fit!",
        rating: 5,
        createdAt: "2024-10-01T10:15:12.893Z",
      },
    ],
  };

  // States to track wishlist and cart button states
  const [isWishlisted, setWishlisted] = useState(false);
  const [isInCart, setInCart] = useState(false);

  const handleWishlist = () => setWishlisted(!isWishlisted);
  const handleAddToCart = () => setInCart(!isInCart);

  return (
    <ScrollView style={styles.container}>
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
        <View style={styles.reviewsContainer}>
          <Text style={styles.reviewsTitle}>Customer Reviews:</Text>
          {product.reviews.map((review, index) => (
            <View key={index} style={styles.reviewBox}>
              <Text style={styles.reviewUsername}>{review.username}</Text>
              <Text style={styles.reviewRating}>{review.rating} ★</Text>
              <Text style={styles.reviewText}>{review.reviewText}</Text>
              <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Floating action bar with icons */}
      {/* Floating action bar with icons */}
<View style={styles.actionBar}>
  <TouchableOpacity
    style={styles.actionButton} // Remove conditional buttonActive style
    onPress={handleWishlist}
  >
    <Icon
      name="heart"
      size={24}
      color={isWishlisted ? '#ff6b6b' : '#fff'} // Change icon color based on isWishlisted
    />
    <Text style={styles.actionText}>Wishlist</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={styles.actionButton} // Remove conditional buttonActive style
    onPress={handleAddToCart}
  >
    <Icon
      name="cart"
      size={24}
      color={isInCart ? '#008000' : '#fff'} // Change icon color based on isInCart
    />
    <Text style={styles.actionText}>Add to Cart</Text>
  </TouchableOpacity>
</View>

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
  buttonActive: {
    backgroundColor: '#ff6b6b',
    padding: 10,
    borderRadius: 30,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
  },
});
