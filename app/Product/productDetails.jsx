import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { useLocalSearchParams } from "expo-router";
import { db } from "../../configs/firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

// Import for Algolia
import algoliasearch from 'algoliasearch/lite';

export default function ProductDetails({ route }) {
  const navigation = useNavigation();
  const item = useLocalSearchParams();
  const { itemId } = useLocalSearchParams();

  const [categories, setCategories] = useState([]);
  const [clothes, setClothes] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [isWishlisted, setIsInWishlist] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize Algolia client
  const searchClient = algoliasearch('VIX0G4CQXG', 'e28a685420a7303098b8683c143e094d');
  const index = searchClient.initIndex('clothes');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const clothesCollection = collection(db, "clothes");
        const clothesSnapshot = await getDocs(clothesCollection);
        const clothesData = clothesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClothes(clothesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Find the current product
  const product = clothes.find((cloth) => cloth.id === itemId);

  // Fetch similar products from Algolia
  useEffect(() => {
    const fetchSimilarProducts = async () => {
      if (itemId && product && product.category) {
        try {
          console.log(`Searching for products with category: ${product.category}`);
          
          // Use search instead of findSimilarObjects
          const { hits } = await index.search('', {
            filters: `category:'${product.category}' AND NOT objectID:'${itemId}'`,
            hitsPerPage: 5
          });
          
          console.log('Algolia hits:', hits);
          
          if (hits && hits.length > 0) {
            // Map Algolia data to match our expected format
            const formattedHits = hits.map(hit => ({
              id: hit.objectID,
              name: hit.name,
              price: hit.price,
              Image: hit.Image, // Make sure this field matches in Algolia
              brand: hit.brand,
              category: hit.category
            }));
            
            setSimilarProducts(formattedHits);
            console.log('Similar products fetched and formatted:', formattedHits);
          } else {
            console.log('No hits from Algolia, using fallback');
            useFallbackSimilarProducts();
          }
        } catch (error) {
          console.error('Error fetching similar products from Algolia:', error);
          useFallbackSimilarProducts();
        }
      }
    };

    const useFallbackSimilarProducts = () => {
      // Fallback method: use firestore to get random products from the same category
      if (product && product.category) {
        const fallbackSimilar = clothes
          .filter(item => item.category === product.category && item.id !== itemId)
          .slice(0, 5);
        
        console.log('Using fallback similar products:', fallbackSimilar);
        setSimilarProducts(fallbackSimilar);
      }
    };

    if (clothes.length > 0 && itemId && product) {
      fetchSimilarProducts();
    }
  }, [itemId, clothes, product]);

  // Fetch data from Firestore
  const [isInRecentlyViewed, setIsInRecentlyViewed] = useState(false);

  useEffect(() => {
    const updateRecentlyViewed = async () => {
      try {
        const userId = getAuth().currentUser.uid; // Get current user ID
        const userDocRef = doc(db, "RecentlyView", userId);

        // Check if the document exists
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const items = userDocSnap.data().items || []; // Get existing items

          // Remove the current item if it exists in the array (to avoid duplicates)
          const updatedItems = items.filter((id) => id !== itemId);

          // Add the new item to the beginning of the array
          updatedItems.unshift(itemId);

          // Trim the array to keep only the last 10 items
          const trimmedItems = updatedItems.slice(0, 10);

          // Update the Firestore document with the trimmed list
          await updateDoc(userDocRef, { items: trimmedItems });
          console.log(
            `Item ${itemId} added to RecentlyView and trimmed to 10 items.`
          );
        } else {
          // If the document doesn't exist, create it
          await setDoc(userDocRef, { items: [itemId] });
          console.log(
            `Created RecentlyView document for user ${userId} with initial item.`
          );
        }
      } catch (error) {
        console.error("Error updating RecentlyView collection:", error);
      }
    };

    if (itemId) {
      updateRecentlyViewed();
    }
  }, [itemId]);

  useEffect(() => {
    // Check if the item is in the wishlist on component mount
    const fetchWishlistState = async () => {
      try {
        const userId = getAuth().currentUser.uid;
        const userDocRef = doc(db, "wishlist", userId);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const items = userDocSnap.data().items || [];
          setIsInWishlist(items.includes(item.itemId));
        }
      } catch (error) {
        console.error("Error fetching wishlist state:", error);
      }
    };

    fetchWishlistState();
  }, [item.itemId]);

  const tryOn = async (product) => {
    const userId = getAuth().currentUser.uid;
    try {
      const docRef = doc(db, "latest_change", "z05FheO9QOpCPJQItShC");
      await setDoc(docRef, {
        clothe_link: product["3dmodelLink"] || "",  // ensure product has this field
        model_link: product.model_link || "",    // ensure product has this field
        userId: userId
      });
      console.log("Data updated successfully!");
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };
  const addToWishlist = async (clotheId) => {
    try {
      const userId = getAuth().currentUser.uid; // Get the current user ID
      const userDocRef = doc(db, "wishlist", userId); // Reference to the user's wishlist document

      const userDocSnap = await getDoc(userDocRef);

      let updatedItems = [];
      if (userDocSnap.exists()) {
        const items = userDocSnap.data().items || [];

        if (items.includes(clotheId)) {
          // Remove the item if it's already in the wishlist
          updatedItems = items.filter((id) => id !== clotheId);
          setIsInWishlist(false);
        } else {
          // Add the item to the wishlist
          updatedItems = [...items, clotheId];
          setIsInWishlist(true);
        }
      } else {
        // If no wishlist exists, create one with the item
        updatedItems = [clotheId];
        setIsInWishlist(true);
      }

      // Update the wishlist document in Firestore
      await setDoc(userDocRef, { items: updatedItems }, { merge: true });

      console.log("Wishlist updated successfully!");
    } catch (error) {
      console.error("Error updating wishlist:", error);
    }
  };

  useEffect(() => {
    // Check if the item is in the cart on component mount
    const fetchCartState = async () => {
      try {
        const userId = getAuth().currentUser.uid;
        const userDocRef = doc(db, "cart", userId); // Reference to the user's cart document
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const items = userDocSnap.data().items || [];
          setIsInCart(items.includes(item.itemId)); // Check if the item is in the cart
        }
      } catch (error) {
        console.error("Error fetching cart state:", error);
      }
    };

    fetchCartState();
  }, [item.itemId]); // Effect runs when itemId changes

  const addToCart = async (clotheId) => {
    try {
      const userId = getAuth().currentUser.uid; // Get the current user ID
      const userDocRef = doc(db, "cart", userId); // Reference to the user's cart document

      const userDocSnap = await getDoc(userDocRef);

      let updatedItems = [];
      if (userDocSnap.exists()) {
        const items = userDocSnap.data().items || [];

        if (items.includes(clotheId)) {
          // Remove the item from the cart if it's already there
          updatedItems = items.filter((id) => id !== clotheId);
          setIsInCart(false); // Update the state to show the item is not in the cart
        } else {
          // Add the item to the cart
          updatedItems = [...items, clotheId];
          setIsInCart(true); // Update the state to show the item is in the cart
        }
      } else {
        // If no cart exists, create one with the item
        updatedItems = [clotheId];
        setIsInCart(true); // Set the state to show the item is in the cart
      }

      // Update the cart document in Firestore
      await setDoc(userDocRef, { items: updatedItems }, { merge: true });

      console.log("Cart updated successfully!");
    } catch (error) {
      console.error("Error updating cart:", error);
    }
  };
  
  // Navigate to the product detail page for the selected recommendation
  const navigateToProduct = (productId) => {
    console.log("Navigating to product:", productId);
    
    // Reset the screen with new params
    navigation.push("Product/productDetails", { itemId: productId });
  };

  return (
    <ScrollView style={styles.container}>
      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : product ? (
        <>
          <Image source={{ uri: product.Image }} style={styles.productImage} />
          <View style={styles.detailsContainer}>
            <Text style={styles.productName}>{product.name}</Text> 
            <View style={styles.productInfoContainer}>
            <TouchableOpacity style={styles.avatarButton} onPress={() => tryOn(product)}>
  <Text style={styles.avatarButtonText}>Try Avatar</Text>
</TouchableOpacity>

 
</View>
              <Text style={styles.productPrice}>${product.price}</Text>
            <View style={styles.detailsBox}>
              <Text style={styles.productDetails}>
                Brand: <Text style={styles.highlight}>{product.brand}</Text>
              </Text>
              <Text style={styles.productDetails}>
                Size: <Text style={styles.highlight}>{product.size}</Text>
              </Text>
              <Text style={styles.productDetails}>
                Color: <Text style={styles.highlight}>{product.color}</Text>
              </Text>
              <Text style={styles.productDetails}>
                Material:{" "}
                <Text style={styles.highlight}>{product.material}</Text>
              </Text>
              <Text style={styles.productDetails}>
                Stock Availability:{" "}
                <Text style={styles.highlight}>{product.availability}</Text>
              </Text>
              <Text style={styles.productDetails}>
                Rating: <Text style={styles.highlight}>{product.rating} ★</Text>
              </Text>

              <Text style={styles.productDetails}>
                Care Instruction{" "}
                <Text style={styles.highlight}>{product.careInstructions}</Text>
              </Text>
            </View>

            <Text style={styles.productDescription}>{product.description}</Text>

            {/* Similar Products Section */}
            {similarProducts.length > 0 && (
              <View style={styles.recommendationsContainer}>
                <Text style={styles.recommendationsTitle}>You Might Also Like:</Text>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={similarProducts}
                  keyExtractor={(item) => item.id || item.objectID || Math.random().toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.recommendedProductCard}
                      onPress={() => navigateToProduct(item.id || item.objectID)}
                    >
                      <Image 
                        source={{ uri: item.Image }} 
                        style={styles.recommendedProductImage} 
                        resizeMode="cover"
                      />
                      <Text style={styles.recommendedProductName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.recommendedProductPrice}>
                        ${item.price}
                      </Text>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Text style={styles.noSimilarProducts}>No similar products found</Text>
                  }
                />
              </View>
            )}

            {/* Reviews Section */}
            <View style={styles.reviewsContainer}>
              <Text style={styles.reviewsTitle}>Customer Reviews:</Text>
              {/* Hardcoded reviews */}
              {[
                {
                  username: "Mark Johnson",
                  rating: 3,
                  reviewText:
                    "Decent product, but I expected it to be a bit better.",
                  createdAt: "2023-12-08T14:45:00Z",
                },
              ].map((review, index) => (
                <View key={index} style={styles.reviewBox}>
                  <Text style={styles.reviewUsername}>{review.username}</Text>
                  <Text style={styles.reviewRating}>{review.rating} ★</Text>
                  <Text style={styles.reviewText}>{review.reviewText}</Text>
                  <Text style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Floating action bar with icons */}
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => addToWishlist(item.itemId)}
            >
              <Icon
                name="heart"
                size={24}
                color={isWishlisted ? "#ff6b6b" : "#fff"}
              />
              <Text style={styles.actionText}>Wishlist</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => addToCart(item.itemId)}
            >
              <Icon
                name="cart"
                size={24}
                color={isInCart ? "#008000" : "#fff"}
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
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  productImage: {
    width: "100%",
    height: 300,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  detailsContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  productName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ff6b6b",
    marginVertical: 8,
  },
  detailsBox: {
    marginVertical: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
  },
  productDetails: {
    fontSize: 16,
    color: "#555",
    marginVertical: 4,
  },
  highlight: {
    fontWeight: "bold",
    color: "#333",
  },
  productDescription: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    lineHeight: 22,
  },
  // Recommendations styles
  recommendationsContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  recommendationsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  recommendedProductCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  recommendedProductImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    marginBottom: 5,
    backgroundColor: "#f0f0f0", // Placeholder background
  },
  recommendedProductName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  recommendedProductPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#ff6b6b",
  },
  noSimilarProducts: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  reviewsContainer: {
    marginTop: 20,
  },
  reviewsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  reviewBox: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  reviewUsername: {
    fontWeight: "bold",
    color: "#333",
  },
  reviewRating: {
    color: "#ff6b6b",
  },
  reviewText: {
    color: "#666",
  },
  reviewDate: {
    color: "#999",
    fontSize: 12,
    marginTop: 5,
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#333",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  actionButton: {
    alignItems: "center",
  },
  actionText: {
    color: "#fff",
    fontSize: 14,
    marginTop: 4,
  },productInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  
  avatarButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  
  avatarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  

  
});