// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage} from "firebase/storage"
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
export const auth = getAuth(app);
export const db= getFirestore(app)
export const storage = getStorage(app);
