import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, FlatList, Alert, ActivityIndicator } from 'react-native';
import { auth, storage, db } from '../../configs/firebase';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export default function Profile() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [orders, setOrders] = useState([]);
  const [profileImageUri, setProfileImageUri] = useState('https://via.placeholder.com/150');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    fetchUserProfile();
    fetchUserOrders();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      setEmail(user.email);
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUsername(data.username || '');
        setProfileImageUri(data.profileImage || 'https://via.placeholder.com/150');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOrders = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const orderQuery = query(
        collection(db, 'orders'),
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(orderQuery);
      const ordersList = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        ordersList.push({
          id: doc.id,
          ...data,
          // Handle Firestore timestamp correctly
          createdAt: data.createdAt ? data.createdAt : new Date()
        });
      });
      
      // Sort with proper handling of Firestore timestamps
      const sortedOrders = ordersList.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate();
        const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate();
        return dateB - dateA;
      });
      
      setOrders(sortedOrders);
      console.log("Fetched orders:", sortedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const markOrderAsReceived = async (orderId) => {
    try {
      setUpdatingOrderId(orderId);
      
      // Reference to the order document
      const orderRef = doc(db, 'orders', orderId);
      
      // Update the status field
      await updateDoc(orderRef, {
        status: 'Received',
        receivedAt: new Date()
      });
      
      // Update the local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? {...order, status: 'Received', receivedAt: new Date()} 
            : order
        )
      );
      
      Alert.alert('Success', 'Order marked as received!');
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleMarkAsReceived = (orderId) => {
    Alert.alert(
      'Confirm Receipt',
      'Are you sure you want to mark this order as received?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Confirm',
          onPress: () => markOrderAsReceived(orderId)
        }
      ]
    );
  };

  // Modified to always return true for testing
  const isOrderReceivable = (order) => {
    // For debugging - always show the button
    return true;
    
    // Original logic (we'll revert to this after debugging)
    /*
    const status = order?.status?.toLowerCase();
    return status === 'shipped' || status === 'completed' || status === 'processing';
    */
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      const selectedImageUri = result.assets[0].uri;
      setProfileImageUri(selectedImageUri);
      await uploadImageToFirebase(selectedImageUri);
    }
  };

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

  const renderOrderItem = ({ item }) => {
    // Debug logging
    console.log("Rendering order item:", item.id, "Status:", item.status);
    
    // Handle Firebase Timestamp or JavaScript Date object
    let dateObj;
    if (item.createdAt) {
      dateObj = item.createdAt instanceof Date 
        ? item.createdAt 
        : item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
    } else {
      dateObj = new Date();
    }
    
    const date = dateObj.toLocaleDateString();
    const itemCount = item.items ? item.items.length : 0;
    const canReceive = isOrderReceivable(item);
    
    return (
      <View style={styles.orderItemContainer}>
        <View style={styles.orderItem}>
          <View style={styles.orderDetails}>
            <Text style={styles.orderText}>Order #{item.id.slice(0, 8)}</Text>
            <Text style={styles.orderDate}>{date}</Text>
            <Text style={styles.orderItemCount}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</Text>
            <Text style={styles.orderStatus}>Status: {item.status || 'Processing'}</Text>
            <Text style={styles.orderAmount}>Rs {item.totalAmount?.toFixed(2) || 'N/A'}</Text>
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.detailsButton}
              onPress={() => router.push({
                pathname: "/order/OrderDetail",
                params: { orderId: item.id }
              })}
            >
              <Text style={styles.buttonText}>View</Text>
            </TouchableOpacity>
            
            {canReceive && (
              <TouchableOpacity 
                style={styles.receivedButton} 
                onPress={() => handleMarkAsReceived(item.id)}
                disabled={updatingOrderId === item.id}
              >
                {updatingOrderId === item.id ? (
                  <ActivityIndicator size="small" color="#333" />
                ) : (
                  <Text style={styles.receivedButtonText}>Received</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const uploadImageToFirebase = async (uri) => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `profilePictures/${user.uid}.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      setProfileImageUri(downloadURL);
      await setDoc(doc(db, 'users', user.uid), { profileImage: downloadURL }, { merge: true });
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const saveProfile = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      await setDoc(doc(db, 'users', user.uid), { username }, { merge: true });
      setEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.profileCard}>
        <TouchableOpacity onPress={pickImage}>
          <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
        </TouchableOpacity>
        <View style={styles.profileInfo}>
          {editing ? (
            <TextInput style={styles.input} value={username} onChangeText={setUsername} autoFocus />
          ) : (
            <Text style={styles.usernameText}>{username || 'Set username'}</Text>
          )}
          <Text style={styles.emailText}>{email}</Text>
        </View>
        {editing ? (
          <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.sectionTitle}>My Orders</Text>
      {orders.length > 0 ? (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.ordersContainer}
        />
      ) : (
        <Text style={styles.emptyText}>No orders found.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f1f1f1', 
    padding: 16 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  logoutButton: {
    backgroundColor: '#e63821',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold'
  },
  profileCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 6, 
    elevation: 5 
  },
  profileImage: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    borderWidth: 2, 
    borderColor: '#007bff', 
    marginRight: 16 
  },
  profileInfo: { 
    flex: 1 
  },
  usernameText: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#333' 
  },
  emailText: { 
    fontSize: 14, 
    color: '#666', 
    marginTop: 4 
  },
  input: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: '#333', 
    borderBottomWidth: 1, 
    borderColor: '#007bff' 
  },
  editButton: { 
    backgroundColor: '#007bff', 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 8 
  },
  editButtonText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  saveButton: { 
    backgroundColor: '#28a745', 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 8 
  },
  saveButtonText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginVertical: 10 
  },
  ordersContainer: { 
    paddingBottom: 20 
  },
  orderItemContainer: {
    marginBottom: 10
  },
  orderItem: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  orderDetails: { 
    flex: 1 
  },
  orderText: { 
    fontSize: 16, 
    fontWeight: 'bold',
    marginBottom: 5 
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  orderItemCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  orderStatus: {
    fontSize: 14,
    color: '#28a745',
    marginBottom: 4
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff'
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 6,
  },
  detailsButton: { 
    backgroundColor: '#007bff', 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 6,
    alignItems: 'center',
  },
  receivedButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 14,
    fontWeight: '600'
  },
  receivedButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600'
  },
  emptyText: { 
    textAlign: 'center', 
    marginTop: 20, 
    color: '#666' 
  },
});