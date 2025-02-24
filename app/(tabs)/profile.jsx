import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth, storage, db } from '../../configs/firebase';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function Profile() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [orders, setOrders] = useState([]);
  const [profileImageUri, setProfileImageUri] = useState('https://via.placeholder.com/150');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchUserProfile();
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
    }
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

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <TouchableOpacity onPress={pickImage}>
          <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
        </TouchableOpacity>
        <View style={styles.profileInfo}>
          {editing ? (
            <TextInput style={styles.input} value={username} onChangeText={setUsername} autoFocus />
          ) : (
            <Text style={styles.usernameText}>{username}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f1f1', padding: 16 },
  profileCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 5 },
  profileImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: '#007bff', marginRight: 16 },
  profileInfo: { flex: 1 },
  usernameText: { fontSize: 22, fontWeight: '700', color: '#333' },
  emailText: { fontSize: 14, color: '#666', marginTop: 4 },
  input: { fontSize: 22, fontWeight: '700', color: '#333', borderBottomWidth: 1, borderColor: '#007bff' },
  editButton: { backgroundColor: '#007bff', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  editButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  saveButton: { backgroundColor: '#28a745', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  saveButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' }
});
