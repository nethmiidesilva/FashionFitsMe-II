import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../../configs/firebase";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function Home() {
  const [categories, setcategories] = useState([]);
  const [clothes, setClothes] = useState([]);
  const [recent, setrecent] = useState([]);
  const [recentclothes, setrecentclothes] = useState([]);
  const flatListRef = useRef(null);
  const router = useRouter();
  const userId = getAuth().currentUser.uid;

  const fetchData = async () => {
    try {
      const categoryCollection = collection(db, "stories");
      const categorySnapshot = await getDocs(categoryCollection);

      const clothesCollection = collection(db, "clothes");
      const clothesSnapshot = await getDocs(clothesCollection);

      const recentDocRef = doc(db, "RecentlyView", userId);
      const recentSnap = await getDoc(recentDocRef);

      // Fetch category data
      const categoryData = categorySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setcategories(categoryData);

      // Fetch clothes data
      const clothesData = clothesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClothes(clothesData);

      // Fetch recently viewed data
      const fetchedClothes = [];
      if (recentSnap.exists()) {
        const recentData = { id: recentSnap.id, ...recentSnap.data() };
        setrecent(recentData);

        for (const id of recentData.items) {
          const clothesRef = doc(db, "clothes", id);
          const clothesSnap = await getDoc(clothesRef);

          if (clothesSnap.exists()) {
            fetchedClothes.push({ id: clothesSnap.id, ...clothesSnap.data() });
          }
        }

        const trimmedClothes = fetchedClothes.slice(-10).reverse();
        setrecentclothes(trimmedClothes);
      } else {
        setrecent([]);
        setrecentclothes([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.helloSection}>
        <Text style={styles.helloText}>Welcome Back!</Text>
        <Text style={styles.tagline}>
          Discover trending fashion just for you.
        </Text>
      </View>

      <View style={styles.storiesSection}>
        <Text style={styles.sectionTitle}>Latest Stories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.length > 0 ? (
            categories.map((story, index) => (
              <TouchableOpacity
                key={index}
                style={styles.story}
                onPress={() =>
                  router.push({
                    pathname: "category/categorylist",
                    params: { categoryId: story?.categoryId },
                  })
                }
              >
                <Image
                  source={{
                    uri:
                      story.image ||
                      "https://signature.lk/wp-content/uploads/2024/12/7-6-680x920.jpg",
                  }}
                  style={styles.storyImage}
                />
                <Text style={styles.storyText}>
                  {story.categoryName ?? "Unnamed Story"}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No stories available</Text>
          )}
        </ScrollView>
      </View>

      <View style={styles.carouselSection}>
        <Text style={styles.sectionTitle}>Clothes Collection</Text>
        <FlatList
          data={clothes}
          horizontal
          ref={flatListRef}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() =>
                router.push({
                  pathname: "Product/productDetails",
                  params: { itemId: item.id },
                })
              }
            >
              <Image
                source={{
                  uri: item.Image || "https://via.placeholder.com/150",
                }}
                style={styles.productImage}
              />
              <Text style={styles.productName}>
                {item.name || "Unknown Item"}
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.productPrice}>${item.price || "0.00"}</Text>
                <Text style={styles.productDiscount}>
                  ${item.discount || "0.00"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          snapToAlignment="start"
          decelerationRate="fast"
          snapToInterval={(width - 40) / 2}
        />
      </View>

      <View style={styles.recentlyViewedSection}>
        <Text style={styles.sectionTitle}>Recently Viewed</Text>
        <FlatList
          data={recentclothes}
          horizontal
          ref={flatListRef}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productCard}
              onPress={async () => {
                const itemId = item.id;
                try {
                  const recentDocRef = doc(db, "RecentlyView", userId);
                  await updateDoc(recentDocRef, {
                    items: arrayUnion(itemId),
                  });
                } catch (error) {
                  console.error("Error updating recently viewed items:", error);
                }

                router.push({
                  pathname: "Product/productDetails",
                  params: { itemId },
                });
              }}
            >
              <Image
                source={{
                  uri: item.Image || "https://via.placeholder.com/150",
                }}
                style={styles.productImage}
              />
              <Text style={styles.productName}>
                {item.name || "Unknown Item"}
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.productPrice}>${item.price || "0.00"}</Text>
                <Text style={styles.productDiscount}>
                  ${item.discount || "0.00"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          snapToAlignment="start"
          decelerationRate="fast"
          snapToInterval={(width - 40) / 2}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  helloSection: {
    marginBottom: 20,
  },
  helloText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  tagline: {
    fontSize: 16,
    color: "#666",
  },
  storiesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  noDataText: {
    fontSize: 16,
    color: "#999",
  },
  productCard: {
    marginRight: 10,
    width: (width - 40) / 2,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    overflow: "hidden",
    padding: 10,
  },
  productImage: {
    width: "100%",
    height: 150,
    borderRadius: 10,
  },
  productName: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: "bold",
  },
  productPrice: {
    fontSize: 14,
    color: "#333",
  },
  story: {
    marginRight: 10,
    alignItems: "center",
  },
  storyImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  storyText: {
    marginTop: 5,
    fontSize: 14,
  },
  recentlyViewedSection: {
    marginBottom: 30,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between", // Adjust spacing between the two items
    alignItems: "center", // Align vertically if needed
  },
  productPrice: {
    fontSize: 16,
    color: "#fe380e",
    fontWeight: "bold",
  },
  productDiscount: {
    fontSize: 15,
    color: "#53b21c",
  },
});
