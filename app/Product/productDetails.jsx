import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Ionicons";
import { useLocalSearchParams } from "expo-router";
import { db } from "../../configs/firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

export default function ProductDetails({ route }) {
  const navigation = useNavigation();
  const item = useLocalSearchParams();
  console.log(item.itemId);
  const { itemId } = useLocalSearchParams();

  const [categories, setCategories] = useState([]);
  const [clothes, setClothes] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [isWishlisted, setIsInWishlist] = useState(false);
  const [isInCart, setIsInCart] = useState(false);

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
    const fetchData = async () => {
      try {
        const clothesCollection = collection(db, "clothes");
        const clothesSnapshot = await getDocs(clothesCollection);
        const clothesData = clothesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setClothes(clothesData);
        //console.log(clothesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    const wishlist = collection(db, "wishlist");
    const clothesSnapshot = getDocs(wishlist);
    //console.log(clothesSnapshot);
  }, []);

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
  const product = clothes.find((cloth) => cloth.id === item.itemId);

  return (
    <ScrollView style={styles.container}>
      {product ? (
        <>
          <Image source={{ uri: product.imgUrl }} style={styles.productImage} />
          <View style={styles.detailsContainer}>
            <Text style={styles.productName}>{product.name}</Text>
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
              onPress={() => addToWishlist(item.itemId)} // Corrected: Function call wrapped in an anonymous function
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
              onPress={() => addToCart(item.itemId)} // Corrected: Function call wrapped in an anonymous function
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
        <Text style={styles.productName}>Loading .......</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  },
});
