// Import expo environmental variables
// if getting error with typescript https://github.com/firebase/firebase-js-sdk/issues/8332

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCgz_SroYsghGH3cmK0TE5AtBthi1IHVSM",
  authDomain: "devfest-2025-792b6.firebaseapp.com",
  projectId: "devfest-2025-792b6",
  storageBucket: "devfest-2025-792b6.firebasestorage.app",
  messagingSenderId: "414709733802",
  appId: "1:414709733802:web:80ed8d3274162fbca2b3d3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize auth with AsyncStorage persistence
export const auth = getAuth(app);
