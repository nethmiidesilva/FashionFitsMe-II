import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native'
import React from 'react'

export default function Cart() {
  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <Text style={styles.headerText}>My Cart</Text>
      </View>

      
      <ScrollView style={styles.itemsContainer}>
        {['Jacket', 'Dress', 'Sneakers', 'Hat'].map((item, index) => (
          <View key={index} style={styles.itemCard}>
            <Image
              source={{ uri: 'https://via.placeholder.com/150' }}
              style={styles.itemImage}
            />
            <View style={styles.itemDetails}>
                
              <Text style={styles.itemName}>{item}</Text>
              <Text style={styles.itemPrice}>$75.00</Text>

              
              <View style={styles.quantityControl}>
                <TouchableOpacity style={styles.quantityButton}>
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>1</Text>
                <TouchableOpacity style={styles.quantityButton}>
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      
      <View style={styles.checkoutSection}>
        <Text style={styles.totalText}>Total: $300.00</Text>
        <TouchableOpacity style={styles.checkoutButton}>
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
  },
  header: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#333',
  },
  itemsContainer: {
    marginBottom: 20,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    elevation: 4,
    padding: 10,
  },
  itemImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginVertical: 5,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  quantityButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 5,
    padding: 5,
    marginHorizontal: 10,
  },
  quantityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  checkoutSection: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 4,
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  checkoutButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
})
