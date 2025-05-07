import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { useLocalSearchParams } from "expo-router";
import { db } from "../../configs/firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { TextInput, Button } from 'react-native';
import { addDoc, serverTimestamp } from 'firebase/firestore';

// Import for Algolia
import algoliasearch from 'algoliasearch/lite';

export default function ProductDetails() {
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
  const [newComment, setNewComment] = useState('');
  const [userRating, setUserRating] = useState(5); // Default rating value
  const [product, setProduct] = useState(null);

  // Initialize Algolia client
  const searchClient = algoliasearch('VIX0G4CQXG', 'e28a685420a7303098b8683c143e094d');
  const index = searchClient.initIndex('clothes');
  const [visibleCount, setVisibleCount] = useState(3);

  const handleSeeMore = () => {
    setVisibleCount((prev) => prev + 3);
  };
  
  const handleSeeFewer = () => {
    setVisibleCount((prev) => Math.max(prev - 3, 3));
  };
  
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
        
        // Find the current product
        const currentProduct = clothesData.find((cloth) => cloth.id === itemId);
        setProduct(currentProduct);
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [itemId]);

  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const commentsCollection = collection(db, "userComments");
        const commentsSnapshot = await getDocs(commentsCollection);
        const commentsData = commentsSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().dateandtime?.toDate?.() || null,
          }))
          .filter((comment) => comment.itemId === itemId); // manual filter
        setReviews(commentsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setLoading(false);
      }
    };
  
    if (itemId) {
      fetchReviews();
    }
  }, [itemId]);
  
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
  
  // Generate unique display name like "user123"
  function generateDisplayName() {
    return 'user' + Math.floor(100000 + Math.random() * 900000); // 6-digit random ID
  }
  
  // Navigate to the Try On Avatar screen
  const navigateToTryOn = () => {
    if (!product) return;
    
    const auth = getAuth();
    if (!auth.currentUser) {
      Alert.alert(
        "Sign In Required", 
        "You need to sign in to use the virtual try-on feature.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign In", onPress: () => navigation.navigate("auth/login") }
        ]
      );
      return;
    }
    
    navigation.navigate("Avater/TryOnAvatar", { 
      productImage: product.Image,
      productId: product.id,
      productName: product.name
    });
  }

  const handleAddComment = async () => {
    const displayName = await generateDisplayName();
    const userId = getAuth().currentUser.uid;
    if (!userId || newComment.trim() === '') return;
  
    try {
      await addDoc(collection(db, 'userComments'), {
        comment: newComment.trim(),
        dateandtime: serverTimestamp(),
        itemId: itemId, // current item's ID
        userId: userId,
        rating: userRating, // Add the user's rating
        username: displayName || 'Anonymous',
      });
  
      // Update the product's average rating in Firestore
      updateProductRating(itemId, userRating);
      
      setNewComment('');
      setUserRating(5); // Reset rating
      
      // Refresh comments
      setLoading(true);
      const commentsCollection = collection(db, "userComments");
      const commentsSnapshot = await getDocs(commentsCollection);
      const commentsData = commentsSnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().dateandtime?.toDate?.() || null,
        }))
        .filter((comment) => comment.itemId === itemId); // manual filter
      setReviews(commentsData);
      setLoading(false);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };
  
  // Function to update product's average rating
  const updateProductRating = async (productId, newRating) => {
    try {
      const productRef = doc(db, "clothes", productId);
      const productDoc = await getDoc(productRef);
      
      if (productDoc.exists()) {
        const currentData = productDoc.data();
        const currentRatingSum = currentData.ratingSum || currentData.rating || 0;
        const currentRatingCount = currentData.ratingCount || 1;
        
        // Calculate new values
        const newRatingSum = currentRatingSum + newRating;
        const newRatingCount = currentRatingCount + 1;
        const newAverageRating = (newRatingSum / newRatingCount).toFixed(1);
        
        // Update the product document
        await updateDoc(productRef, {
          rating: parseFloat(newAverageRating),
          ratingSum: newRatingSum,
          ratingCount: newRatingCount
        });
        
        // Update local product state
        setProduct(prev => {
          if (prev) {
            return {
              ...prev,
              rating: parseFloat(newAverageRating)
            };
          }
          return prev;
        });
        
        console.log(`Updated product rating to ${newAverageRating}`);
      }
    } catch (error) {
      console.error("Error updating product rating:", error);
    }
  };
  
  const addToCart = async (clotheId) => {
    try {
      if (!product || product.stock <= 0) {
        Alert.alert("Out of Stock", "This item is currently out of stock.");
        return;
      }
      
      const userId = getAuth().currentUser.uid; // Get the current user ID
      const userDocRef = doc(db, "cart", userId); // Reference to the user's cart document
      const productRef = doc(db, "clothes", clotheId); // Reference to the product document

      const userDocSnap = await getDoc(userDocRef);

      let updatedItems = [];
      if (userDocSnap.exists()) {
        const items = userDocSnap.data().items || [];

        if (items.includes(clotheId)) {
          // Remove the item from cart - restore stock
          updatedItems = items.filter((id) => id !== clotheId);
          setIsInCart(false);
          
          // Increment stock back
          await updateDoc(productRef, {
            stock: increment(1)
          });
        } else {
          // Add the item to cart - decrease stock
          updatedItems = [...items, clotheId];
          setIsInCart(true);
          
          // Decrement stock
          await updateDoc(productRef, {
            stock: increment(-1)
          });
        }
      } else {
        // If no cart exists, create one with the item
        updatedItems = [clotheId];
        setIsInCart(true);
        
        // Decrement stock
        await updateDoc(productRef, {
          stock: increment(-1)
        });
      }

      // Update the cart document in Firestore
      await setDoc(userDocRef, { items: updatedItems }, { merge: true });

      // Refresh the product data to get updated stock
      const updatedProductDoc = await getDoc(productRef);
      if (updatedProductDoc.exists()) {
        setProduct({
          ...product,
          stock: updatedProductDoc.data().stock
        });
      }

      console.log("Cart and stock updated successfully!");
    } catch (error) {
      console.error("Error updating cart or stock:", error);
    }
  };
  
  // Navigate to the product detail page for the selected recommendation
  const navigateToProduct = (productId) => {
    console.log("Navigating to product:", productId);
    
    // Reset the screen with new params
    navigation.push("Product/productDetails", { itemId: productId });
  };

  // Rating UI component
  const RatingInput = ({ value, onChange }) => {
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingLabel}>Your Rating:</Text>
        <View style={styles.starContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity 
              key={star} 
              onPress={() => onChange(star)}
              style={styles.starButton}
            >
              <Icon
                name={star <= value ? "star" : "star-outline"}
                size={28}
                color="#FFD700"
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
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
            <Text style={styles.productPrice}>${product.price}</Text>

            {/* Virtual Try-On Button */}
            <TouchableOpacity 
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#007bff',
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 8,
                marginVertical: 15,
              }}
              onPress={navigateToTryOn}
            >
              <Icon name="body-outline" size={20} color="#fff" />
              <Text style={{color: '#fff', fontWeight: 'bold', marginLeft: 8}}>Virtual Try-On</Text>
            </TouchableOpacity>

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
                <Text style={styles.highlight}>{product.stock > 0 ? `${product.stock} in stock` : "Out of Stock"}</Text>
              </Text>
              <Text style={styles.productDetails}>
                Rating: <Text style={styles.highlight}>{Math.floor(product.ratingSum * 100) / 100} ★</Text>
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

            <View style={styles.reviewsContainer}>
              <Text style={styles.reviewsTitle}>Customer Reviews:</Text>

              {reviews.slice(0, visibleCount).map((review, index) => (
                <View key={index} style={styles.reviewBox}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewUsername}>{review.username}</Text>
                    {review.rating && (
                      <Text style={styles.reviewRating}>
                        {review.rating} <Icon name="star" size={14} color="#FFD700" />
                      </Text>
                    )}
                  </View>
                  <Text style={styles.reviewText}>{review.comment}</Text>
                  <Text style={styles.reviewDate}>
                    {review.createdAt?.toLocaleDateString?.() || ''}
                  </Text>
                </View>
              ))}

              <View style={styles.buttonRow}>
                {visibleCount < reviews.length && (
                  <TouchableOpacity onPress={handleSeeMore} style={styles.button}>
                    <Text style={styles.buttonText}>See More</Text>
                  </TouchableOpacity>
                )}
                {visibleCount > 3 && (
                  <TouchableOpacity onPress={handleSeeFewer} style={styles.button}>
                    <Text style={styles.buttonText}>See Fewer</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.addReviewContainer}>
              <Text style={styles.addReviewTitle}>Add Your Review</Text>
              
              {/* Rating Input Component */}
              <RatingInput value={userRating} onChange={setUserRating} />
              
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Write your review..."
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline={true}
                />
                <Button title="Submit" onPress={handleAddComment} />
              </View>
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
              style={[
                styles.actionButton, 
                product.stock <= 0 ? styles.disabledButton : {}
              ]}
              onPress={() => addToCart(item.itemId)}
              disabled={product.stock <= 0}
            >
              <Icon
                name="cart"
                size={24}
                color={isInCart ? "#4CD964" : "#fff"}
              />
              <Text style={styles.actionText}>
                {isInCart ? "Remove from Cart" : "Add to Cart"}
              </Text>
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
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  reviewUsername: {
    fontWeight: "bold",
    color: "#333",
  },
  reviewRating: {
    color: "#ff6b6b",
    fontWeight: "bold",
  },
  reviewText: {
    color: "#666",
    marginVertical: 5,
  },
  reviewDate: {
    color: "#999",
    fontSize: 12,
    marginTop: 5,
  },
  addReviewContainer: {
    marginTop: 25,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  addReviewTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  ratingContainer: {
    marginBottom: 15,
  },
  ratingLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: "#555",
  },
  starContainer: {
    flexDirection: 'row',
  },
  starButton: {
    padding: 5,
  },
  commentInputContainer: {
    marginVertical: 10,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
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
  disabledButton: {
    opacity: 0.5,
  },
  actionText: {
    color: "#fff",
    fontSize: 14,
    marginTop: 4,
  },
});