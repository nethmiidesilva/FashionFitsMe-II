import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';

const OrderDetail = () => {
  const handleReorder = () => {
    // This function will handle the reorder action
    Alert.alert('Reorder', 'Your reorder action has been initiated.');
    // Here you can add the logic to handle the reorder
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Product Image */}
      <Image
        source={{ uri: 'https://via.placeholder.com/300x300.png?text=T-Shirt' }} // Ensure this URL is correct
        style={styles.productImage}
        resizeMode="cover" // Added to control image scaling
      />

      {/* Product Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.productTitle}>Classic White T-Shirt</Text>
        <Text style={styles.productPrice}>Rs 1600</Text>
        <Text style={styles.productDescription}>
          This classic white T-shirt is made of 100% organic cotton, providing a comfortable and stylish fit for everyday wear. Available in multiple sizes.
        </Text>

        {/* Product Specifications */}
        <View style={styles.specsContainer}>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Size:</Text>
            <Text style={styles.specValue}>M</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Color:</Text>
            <Text style={styles.specValue}>White</Text>
          </View>
        </View>
      </View>

      {/* Action Button */}
      <TouchableOpacity style={styles.button} onPress={handleReorder}>
        <Text style={styles.buttonText}>Reorder</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  productImage: {
    width: 300,
    height: 300,
    borderRadius: 8,
    marginBottom: 20,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007bff',
    marginBottom: 10,
  },
  productDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  specsContainer: {
    marginTop: 10,
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  specLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  specValue: {
    fontSize: 16,
    color: '#666',
  },
  button: {
    width: '90%',
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default OrderDetail;
