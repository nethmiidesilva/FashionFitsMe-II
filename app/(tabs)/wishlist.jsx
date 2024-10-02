import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native'
import React from 'react'

export default function Wishlist() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>My Wishlist</Text>
      </View>

      <View style={styles.itemsContainer}>
        {['Jacket', 'Dress', 'Sneakers', 'Hat'].map((item, index) => (
          <View key={index} style={styles.itemCard}>
            <Image
              source={{ uri: 'https://via.placeholder.com/150' }}
              style={styles.itemImage}
            />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item}</Text>
              <Text style={styles.itemPrice}>$75.00</Text>
              <TouchableOpacity style={styles.removeButton}>
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
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
    marginBottom: 30,
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
  removeButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 15,
    alignSelf: 'flex-start',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
})
