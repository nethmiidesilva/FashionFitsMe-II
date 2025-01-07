import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { auth, db } from './../../configs/firebase';  // Ensure your firebase config is correctly imported
import { useFocusEffect } from '@react-navigation/native';  // Import the hook

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  // Use useFocusEffect to re-fetch wishlist every time the page is focused
  useFocusEffect(
    React.useCallback(() => {
      const fetchWishlist = async () => {
        if (user) {
          try {
            const userId = user.uid;
            const userDocRef = doc(db, 'wishlist', userId);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const wishlistItems = userDocSnap.data().items || [];
              setWishlist(wishlistItems);
              console.log(wishlistItems)
            } else {
              console.log('No wishlist found for this user.');
            }
          } catch (error) {
            console.error('Error fetching wishlist:', error);
          } finally {
            setLoading(false);
          }
        }
      };

      fetchWishlist();
    }, [user])  // Dependency array ensures it runs only when `user` changes
  );

  // Function to remove an item from the wishlist
  const removeFromWishlist = async (itemId) => {
    if (user) {
      try {
        const userId = user.uid;
        const userDocRef = doc(db, 'wishlist', userId);
        console.log(itemId);
  
        // Check if itemId is valid before proceeding
        if (!itemId) {
          console.error('Invalid item ID:', itemId);
          return;  // Exit early if the itemId is not valid
        }
  
        // Check if the item exists in the wishlist array
        const itemToRemove = wishlist.find(item => item === itemId);  // Simple string match
  
        if (!itemToRemove) {
          console.error('Item not found in the wishlist.');
          return;  // Exit early if the item is not found
        }
  
        // Update the Firestore document to remove the item by its string value
        await updateDoc(userDocRef, {
          items: arrayRemove(itemId)  // Remove the exact string item
        });
  
        // Update the local state to reflect the removal
        setWishlist((prevWishlist) => prevWishlist.filter((item) => item !== itemId));
      } catch (error) {
        console.error('Error removing item from wishlist:', error);
      }
    }
  };
  
  
  

  const renderWishlistItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemTitle}>{item}</Text>
        <Text style={styles.itemDescription}>
          {item.description ? item.description.slice(0, 50) + '...' : 'No description available.'}
        </Text>
        <Text style={styles.itemPrice}>Rs {item.price ? item.price : 'N/A'}</Text>
      </View>
      <TouchableOpacity style={styles.removeButton} onPress={() => removeFromWishlist(item)}>
        <Text style={styles.removeButtonText}>Remove</Text>
      </TouchableOpacity>
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
      {wishlist.length > 0 ? (
        <FlatList
          data={wishlist}
          renderItem={renderWishlistItem}
          keyExtractor={(item) => item.id || item.title}  // Use a unique id if available
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <Text style={styles.emptyMessage}>Your wishlist is empty.</Text>
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
  listContent: {
    paddingBottom: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 16,
    marginBottom: 10,
    borderRadius: 8,
  },
  itemImage: {
    width: 60,
    height: 60,
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
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    marginTop: 4,
  },
  removeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ff4d4f',
    borderRadius: 4,
  },
  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#888',
    fontSize: 18,
    marginTop: 20,
  },
});
