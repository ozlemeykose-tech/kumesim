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

const firebaseConfig = {
  apiKey: "AIzaSyAacF7Ax3x-OQ5s_dBMEst6MYsP3Qa4fVg",
  authDomain: "kumesim-yeni.firebaseapp.com",
  projectId: "kumesim-yeni",
  storageBucket: "kumesim-yeni.firebasestorage.app",
  messagingSenderId: "480888156704",
  appId: "1:480888156704:web:0ae47cb65139ab4e9dc240",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth with LOCAL persistence — stays logged in until explicit logout
let _auth: ReturnType<typeof getAuth>;
if (Platform.OS === "web") {
  _auth = getAuth(app);
  // Explicit LOCAL (localStorage) persistence for web
  setPersistence(_auth, browserLocalPersistence).catch(() => {});
} else {
  try {
    _auth = initializeAuth(app, {
      // AsyncStorage = LOCAL persistence on native
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // auth already initialized on hot reload
    _auth = getAuth(app);
  }
}

export const auth = _auth;
export const db = getFirestore(app);
export const storage = getStorage(app);
