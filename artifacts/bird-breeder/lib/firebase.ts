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
  apiKey: "AIzaSyClKBEnqKB1mBn_BWDTtZgMfHol9J3KayY",
  authDomain: "kumesim-e9eed.firebaseapp.com",
  projectId: "kumesim-e9eed",
  storageBucket: "kumesim-e9eed.firebasestorage.app",
  messagingSenderId: "741895594647",
  appId: "1:741895594647:web:092dc28d51d49f3ca63fd2",
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
