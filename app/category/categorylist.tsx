import { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../configs/firebase';  // Ensure your Firebase config is imported
import { Text, View, FlatList, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';  // Ensure required components are imported from React Native
import { useRouter } from 'expo-router'; // Assuming you are using next/router for navigation

const { width } = Dimensions.get('window');  // Get screen width for calculating carousel item size
const itemWidth = (width - 40) / 2;  // Subtract 40 for margin and then divide by 2 for 2 columns

export default function ClothingDetails() {
  const [clothes, setClothes] = useState<any[]>([]); // Array to hold clothing details
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const item = useLocalSearchParams();
  const storyId = String(item.categoryId);
  const flatListRef = useRef(null);  // Reference for FlatList
  const router = useRouter();

  useEffect(() => {
    const fetchClothDetails = async () => {
      try {
        if (storyId) {
          const docRef = doc(db, 'stories', storyId); // Reference to the story document
          const docSnap = await getDoc(docRef); // Fetch the story document

          if (docSnap.exists()) {
            // Extract clothesIds array from the story document
            const clothesIds = docSnap.data().clothesIds;
            console.log(clothesIds);

            // Initialize an array to hold the fetched clothing details
            const fetchedClothes = [];

            // Loop over the clothesIds array to fetch each clothing document
            for (const id of clothesIds) {
              const clothesRef = doc(db, 'clothes', id);
              const clothesSnap = await getDoc(clothesRef);

              if (clothesSnap.exists()) {
                // Add clothing details to the fetchedClothes array
                fetchedClothes.push(clothesSnap.data());
              } else {
                console.log(`No clothing document found for ID: ${id}`);
              }
            }

            // Once all clothing documents are fetched, update the state
            setClothes(fetchedClothes);
            setLoading(false);
          } else {
            setError('Story not found.');
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error fetching clothing details:', error);
        setError('Failed to load clothing details.');
        setLoading(false);
      }
    };

    fetchClothDetails();
  }, [storyId]); // Re-run the effect when storyId changes

  if (loading) {
    return <Text style={styles.text}>Loading...</Text>;
  }

  if (error) {
    return <Text style={styles.text}>Error: {error}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{item.categoryId}</Text>

      <View style={styles.carouselSection}>
        <Text style={styles.sectionTitle}>Clothes Collection</Text>
        <FlatList
          data={clothes}
          horizontal={false} // This should be false for a vertical list
          numColumns={2} // Set to 2 to display items in two columns
          ref={flatListRef}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.productCard, { width: itemWidth }]} // Ensure all items have the same width
              onPress={() =>
                router.push({
                  pathname: '/Product/productDetails',
                  params: { itemId: item.clotheId },
                })
              }
            >
              <Image
                source={{ uri: item.Image || 'https://via.placeholder.com/150' }}
                style={styles.productImage}
              />
              <Text style={styles.productName}>{item.name || 'Unknown Item'}</Text>
              
              <View style={styles.row}>
  <Text style={[styles.productPrice, { marginRight: 40 }]}>
    ${item.price || '0.00'}
  </Text>
  <Text style={styles.productDiscount}>
    {item.discount ? item.discount : ""}
  </Text>
</View>

            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.clotheId}
          contentContainerStyle={styles.flatListContent} // Add padding/margin
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  header: {
    marginTop: 20,
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 0,
  },
  carouselSection: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    marginLeft:10,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  productCard: {
    width: 110,  // Set a fixed width for the product card
    margin: 3,   // Space between items
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
    padding: 10,
    alignItems: 'center',
    height: 220, // Uniform height for all product cards
  },
  
  productImage: {
    width: '100%',
    height: 120, // Ensure all images fit well in the same height
    borderRadius: 8,
    marginBottom: 10,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    
    marginBottom: 5,
  },
  productId: {
    fontSize: 12,
    color: '#777',
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 17,
    fontWeight: 'bold',
    color: "#fe380e",
  },
  productDiscount: {
    fontSize: 14,
    color: "#53b21c",
  },
  flatListContent: {
    paddingLeft: 5, // Space before the first card
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
});