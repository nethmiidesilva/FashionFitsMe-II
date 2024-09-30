// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);