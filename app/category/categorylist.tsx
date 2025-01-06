import { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../configs/firebase';  // Ensure your Firebase config is imported
import { Text, View, FlatList, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';  // Ensure required components are imported from React Native
import { useRouter } from 'expo-router'; // Assuming you are using next/router for navigation

const { width } = Dimensions.get('window');  // Get screen width for calculating carousel item size

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
                // Log the entire document structure (not just path)
                console.log('Cloth data:', clothesSnap.data());

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
      <Text style={styles.header}>Clothing Details</Text>

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
                       onPress={() => router.push({
                         pathname: '/Product/productDetails',
                         params: { itemId: item.clotheId },
                       })}
                     >
                       <Image 
                         source={{ uri: item.imgUrl || 'https://via.placeholder.com/150' }} 
                         style={styles.productImage} 
                       />
                       <Text style={styles.productName}>{item.name || 'Unknown Item'}</Text>
              <Text style={styles.productName}>{item.clotheId || 'Unknown Item'}</Text>
              <Text style={styles.productPrice}>${item.price || '0.00'}</Text>
                     </TouchableOpacity>
                   )}
                   keyExtractor={(item) => item.id}
                   snapToAlignment="start"
                   decelerationRate="fast"
                   snapToInterval={(width - 40) / 2} 
                 />
        
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  carouselSection: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  productCard: {
    width: (width - 40) / 2, // Adjust for horizontal layout
    marginRight: 20,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    padding: 10,
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 14,
    color: '#555',
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
});
