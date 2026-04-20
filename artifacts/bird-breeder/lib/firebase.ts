import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
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
  measurementId: "G-F0WBPMX9ZL",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

function createAuth() {
  try {
    if (Platform.OS === "web") return getAuth(app);
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();
export const db = getFirestore(app);
export const storage = getStorage(app);
