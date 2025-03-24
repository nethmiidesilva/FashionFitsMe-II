import React, { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from './../../configs/firebase';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from "expo-router";
import { MaterialIcons } from '@expo/vector-icons';

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;
  const router = useRouter();

  useFocusEffect(
    React.useCallback(() => {
      const fetchCart = async () => {
        if (user) {
          try {
            const userId = user.uid;
            const userDocRef = doc(db, 'cart', userId);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const cartItems = userDocSnap.data().items || [];
              const fetchedClothes = [];

              for (const id of cartItems) {
                const clothesRef = doc(db, 'clothes', id);
                const clothesSnap = await getDoc(clothesRef);

                if (clothesSnap.exists()) {
                  fetchedClothes.push({ id: clothesSnap.id, ...clothesSnap.data() });
                }
              }

              const trimmedClothes = fetchedClothes.slice(-10).reverse();
              setCart(trimmedClothes);
            } else {
              setCart([]);
            }
          } catch (error) {
            console.error('Error fetching cart:', error);
          } finally {
            setLoading(false);
          }
        }
      };

      fetchCart();
    }, [user])
  );

  const removeFromCart = async (itemId) => {
    if (user) {
      try {
        const userId = user.uid;
        const userDocRef = doc(db, 'cart', userId);

        await updateDoc(userDocRef, {
          items: arrayRemove(itemId),
        });

        setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
      } catch (error) {
        console.error('Error removing item from cart:', error);
      }
    }
  };

  const goToCheckout = (item) => {
    router.push({
      pathname: "checkout/Checkout",
      params: { 
        items: JSON.stringify([item]),
        itemIds: JSON.stringify([item.id]), // Track item ID to remove
        clearCart: "single" // Indicate we want to clear just this item
      }
    });
  };

  const goToCheckoutAll = () => {
    // Extract just the IDs for the clearCart functionality
    const itemIds = cart.map(item => item.id);
    
    router.push({
      pathname: "checkout/Checkout",
      params: { 
        items: JSON.stringify(cart),
        itemIds: JSON.stringify(itemIds), // Add all item IDs
        clearCart: "all" // Indicate we want to clear all items
      }
    });
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity
        style={styles.itemContent}
        onPress={() =>
          router.push({
            pathname: "Product/productDetails",
            params: { itemId: item.id },
          })
        }
      >
        <Image source={{ uri: item.Image }} style={styles.itemImage} />
        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle}>{item.name || 'Unnamed Item'}</Text>
          <Text style={styles.itemDescription}>
            {item.description ? item.description.slice(0, 50) + '...' : 'No description available.'}
          </Text>
          <Text style={styles.itemPrice}>Rs {item.price || 'N/A'}</Text>
        </View>
      </TouchableOpacity>
      
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.checkoutButton} 
          onPress={() => goToCheckout(item)}
        >
          <Text style={styles.checkoutButtonText}>Checkout</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.removeButton} 
          onPress={() => removeFromCart(item.id)}
        >
          <MaterialIcons name="delete" size={20} color="white" />
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Cart</Text>
      </View>

      {cart.length > 0 ? (
        <View style={styles.cartContent}>
          <FlatList
            data={cart}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
          
          {cart.length > 1 && (
            <TouchableOpacity 
              style={styles.checkoutAllButton} 
              onPress={goToCheckoutAll}
            >
              <MaterialIcons name="shopping-cart" size={20} color="white" />
              <Text style={styles.checkoutAllButtonText}>Checkout All Items</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <Text style={styles.emptyMessage}>Your cart is empty.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    paddingTop: 25,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartContent: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 80, // Provide space for the checkout all button
  },
  itemContainer: {
    backgroundColor: '#f9f9f9',
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 16,
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e63821',
    marginTop: 4,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  checkoutButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    backgroundColor: '#e63821',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 30,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#888',
    fontSize: 18,
    marginTop: 20,
  },
  checkoutAllButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  checkoutAllButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});