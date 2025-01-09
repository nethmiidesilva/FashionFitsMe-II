import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { auth, db } from './../../configs/firebase'; // Ensure your firebase config is correctly imported
import { useFocusEffect } from '@react-navigation/native'; // Import the hook
import { useRouter } from "expo-router";
import { MaterialIcons } from '@expo/vector-icons'; // Or use another icon library

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;
  const router = useRouter();

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
              const fetchedClothes = [];

              // Fetch clothes details based on IDs
              for (const id of wishlistItems) {
                const clothesRef = doc(db, 'clothes', id);
                const clothesSnap = await getDoc(clothesRef);

                if (clothesSnap.exists()) {
                  fetchedClothes.push({ id: clothesSnap.id, ...clothesSnap.data() });
                }
              }

              // Reverse and limit to the last 10 items
              const trimmedClothes = fetchedClothes.slice(-10).reverse();
              setWishlist(trimmedClothes);
            } else {
              console.log('No wishlist found for this user.');
              setWishlist([]);
            }
          } catch (error) {
            console.error('Error fetching wishlist:', error);
          } finally {
            setLoading(false);
          }
        }
      };

      fetchWishlist();
    }, [user]) // Dependency array ensures it runs only when `user` changes
  );

  // Function to remove an item from the wishlist
  const removeFromWishlist = async (itemId) => {
    if (user) {
      try {
        const userId = user.uid;
        const userDocRef = doc(db, 'wishlist', userId);

        // Update Firestore document to remove the item
        await updateDoc(userDocRef, {
          items: arrayRemove(itemId),
        });

        // Update local state
        setWishlist((prevWishlist) => prevWishlist.filter((item) => item.id !== itemId));
      } catch (error) {
        console.error('Error removing item from wishlist:', error);
      }
    }
  };

  const renderWishlistItem = ({ item }) => (
    
    <View style={styles.itemContainer}>
      
                  <TouchableOpacity
              style={styles.itemContainer}
              onPress={() =>
                router.push({
                  pathname: "Product/productDetails",
                  params: { itemId: item.id },
                })
              }
            >
      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemTitle}>{item.name || 'Unnamed Item'}</Text>
        <Text style={styles.itemDescription}>
          {item.description ? item.description.slice(0, 50) + '...' : 'No description available.'}
        </Text>
        <Text style={styles.itemPrice}>Rs {item.price || 'N/A'}</Text>
      </View>
      <TouchableOpacity style={styles.removeButton} onPress={() => removeFromWishlist(item.id)}>
  <MaterialIcons name="delete" size={24} color="red" />
</TouchableOpacity>

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
      <View style={styles.headerRow}>
  <Text style={styles.header}>Wishlist</Text>
  
</View>

      {wishlist.length > 0 ? (
        <FlatList
          data={wishlist}
          renderItem={renderWishlistItem}
          keyExtractor={(item) => item.id}
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
    padding: 6,
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

  removeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  header: {
    marginTop: 30,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e63821',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#888',
    fontSize: 18,
    marginTop: 20,
  },
});
