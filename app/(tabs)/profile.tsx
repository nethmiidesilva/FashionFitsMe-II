import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { doc, getDoc, collection, getDocs, DocumentData } from 'firebase/firestore';
import { auth, db } from '../../configs/firebase';

const screenHeight = Dimensions.get('window').height;

interface Order {
  productName: string;
  price: number;
}

interface OrderWithId extends Order {
  id: string;
}

export default function Profile() {
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
          price: doc.data().price,
        })) as OrderWithId[];
        setOrders(ordersData);
      }
    };

    fetchProfileData();
    fetchOrders();
  }, []);

  const renderOrderItem = ({ item }: { item: OrderWithId }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderDetails}>
        <Text style={styles.orderText}>{item.productName}</Text>
        <Text style={styles.orderText}>Price: ${item.price}</Text>
      </View>
      <TouchableOpacity style={styles.detailsButton}>
        <Text style={styles.buttonText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Profile Card */}
      <View style={styles.profileCard}>
        <Image
          source={{ uri: 'https://via.placeholder.com/100' }} // Replace with the actual profile image URL
          style={styles.profileImage}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileText}>Username: {username}</Text>
          <Text style={styles.profileText}>Email: {email}</Text>
        </View>
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
    backgroundColor: '#fff',
    padding: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    padding: 16,
    height: screenHeight * 0.2,
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    justifyContent: 'center',
  },
  profileText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
