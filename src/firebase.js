import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDC0ZlwsBvma_sMefojxdUUPguizE274QI",
  authDomain: "campusswap-5cdf6.firebaseapp.com",
  projectId: "campusswap-5cdf6",
  storageBucket: "campusswap-5cdf6.firebasestorage.app",
  messagingSenderId: "345692937471",
  appId: "1:345692937471:web:c939eb8c7a0791289f40ca",
  measurementId: "G-3X760RZT3N"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
