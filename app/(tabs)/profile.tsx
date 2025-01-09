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
  const router = useRouter();
  const [username, setUsername] = useState<string>('John Doe');
  const [email, setEmail] = useState<string>('johndoe@example.com');
  const [orders, setOrders] = useState<OrderWithId[]>([
    
  ]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert('Logged Out', 'You have been logged out successfully.');
      router.replace('/auth/sign-in');
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
          source={{ uri: 'https://via.placeholder.com/150' }}
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
    backgroundColor: '#f1f1f1',
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#007bff',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  usernameText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
  },
  emailText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#444444',
    marginBottom: 10,
  },
  ordersContainer: {
    paddingBottom: 20,
  },
  orderItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  orderDetails: {
    flex: 1,
  },
  orderText: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 4,
  },
  detailsButton: {
    backgroundColor: '#007bff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999999',
    fontSize: 16,
    marginTop: 20,
  },
});
