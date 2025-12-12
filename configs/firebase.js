// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

//  IMPORTANT: React Native must use initializeAuth, not getAuth
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAuyDu_QPFzc4_6QU6Q79DFdwToP1O6sis",
  authDomain: "fashionfitsme-ii.firebaseapp.com",
  projectId: "fashionfitsme-ii",
  storageBucket: "fashionfitsme-ii.appspot.com",
  messagingSenderId: "1097542637975",
  appId: "1:1097542637975:web:5d549f0b37894b92da0cd2",
  measurementId: "G-QTQTTSH18Z"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

//  Proper Auth initialization for React Native
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);
