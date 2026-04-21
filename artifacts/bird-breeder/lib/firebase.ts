import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// kumesim-yeni — production Firebase project
const firebaseConfig = {
  apiKey: "AIzaSyAacF7Ax3x-uV2_B79z49N0M9G7G6-zW9lW",
  authDomain: "kumesim-yeni.firebaseapp.com",
  projectId: "kumesim-yeni",
  storageBucket: "kumesim-yeni.firebasestorage.app",
  messagingSenderId: "480888156704",
  appId: "1:480888156704:web:9f8e43e49e4d9c7e7b7b7",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// LOCAL persistence: user stays logged in until explicit logout
let _auth: ReturnType<typeof getAuth>;
if (Platform.OS === "web") {
  _auth = getAuth(app);
  setPersistence(_auth, browserLocalPersistence).catch(() => {});
} else {
  try {
    _auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    _auth = getAuth(app);
  }
}

export const auth = _auth;
export const db = getFirestore(app);
export const storage = getStorage(app);
