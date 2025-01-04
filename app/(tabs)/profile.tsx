import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, Dimensions, TouchableOpacity, Alert } from 'react-native';
import { doc, getDoc, collection, getDocs, DocumentData } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../configs/firebase';
import { useRouter } from 'expo-router';

const screenHeight = Dimensions.get('window').height;

interface Order {
  productName: string;
  price: number;
}

interface OrderWithId extends Order {
  id: string;
}

export default function Profile() {
  const router = useRouter(); // Initialize router
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [orders, setOrders] = useState<OrderWithId[]>([]);

  useEffect(() => {
    const fetchProfileData = async () => {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const userDoc = doc(db, 'users', userId);
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists()) {
          const data = docSnap.data() as DocumentData;
          setUsername(data.username || 'N/A');
          setEmail(data.email || 'N/A');
        }
      }
    };

    const fetchOrders = async () => {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const ordersCollection = collection(db, 'users', userId, 'myorders');
        const ordersSnapshot = await getDocs(ordersCollection);
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          productName: doc.data().productName,
          price: doc.data().Price, // Ensure this matches the database field
        })) as OrderWithId[];
        setOrders(ordersData);
      }
    };

    fetchProfileData();
    fetchOrders();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert('Logged Out', 'You have been logged out successfully.');
      router.replace('/auth/sign-in'); // Navigate to sign-in page
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Logout Failed', 'An error occurred while logging out.');
    }
  };

  const renderOrderItem = ({ item }: { item: OrderWithId }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderDetails}>
        <Text style={styles.orderText}>{item.productName}</Text>
        <Text style={styles.orderText}>Price: Rs {item.price}</Text>
      </View>
      <TouchableOpacity
        style={styles.detailsButton}
        
      >
        <Text style={styles.buttonText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <Image
          source={{ uri: 'https://via.placeholder.com/100' }}
          style={styles.profileImage}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.usernameText}>{username}</Text>
          <Text style={styles.emailText}>{email}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* My Orders Section */}
      <Text style={styles.sectionTitle}>My Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.ordersContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>No orders found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16,
    paddingTop: 25,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  profileImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  usernameText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  emailText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    padding: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  ordersContainer: {
    paddingBottom: 20,
  },
  orderItem: {
    backgroundColor: '#e0e0e0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDetails: {
    flex: 1,
  },
  orderText: {
    fontSize: 16,
    color: '#333',
  },
  detailsButton: {
    backgroundColor: '#007bff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 20,
  },
});
