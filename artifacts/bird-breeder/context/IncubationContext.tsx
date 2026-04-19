import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface IncubationBatch {
  id: string;
  birdName: string;
  species: string;
  eggCount: number;
  startDate: string;
  incubationDays: number;
  notes?: string;
  status: "active" | "hatched" | "failed";
  notificationSent?: boolean;
}

export const SPECIES_LIST: { label: string; days: number }[] = [
  { label: "Muhabbet Kuşu", days: 18 },
  { label: "Sultan Papağanı", days: 20 },
  { label: "Kanarya", days: 14 },
  { label: "Fink", days: 14 },
  { label: "Hint Bülbülü", days: 14 },
  { label: "Güvercin", days: 18 },
  { label: "Diğer", days: 18 },
];

export type TurkishStatus = "Yumurtada" | "Çıkım Bekleniyor" | "Çıktı" | "Başarısız";

interface IncubationContextType {
  batches: IncubationBatch[];
  addBatch: (batch: Omit<IncubationBatch, "id">) => Promise<void>;
  updateBatch: (id: string, updates: Partial<IncubationBatch>) => Promise<void>;
  deleteBatch: (id: string) => Promise<void>;
  getDaysRemaining: (batch: IncubationBatch) => number;
  getProgress: (batch: IncubationBatch) => number;
  getTurkishStatus: (batch: IncubationBatch) => TurkishStatus;
  clearAll: () => Promise<void>;
}

const IncubationContext = createContext<IncubationContextType>({
  batches: [],
  addBatch: async () => {},
  updateBatch: async () => {},
  deleteBatch: async () => {},
  getDaysRemaining: () => 0,
  getProgress: () => 0,
  getTurkishStatus: () => "Yumurtada",
  clearAll: async () => {},
});

const STORAGE_KEY = "incubation_data_v2";

async function requestNotificationPermission() {
  if (Platform.OS === "web") return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

async function sendHatchNotification(batchName: string) {
  if (Platform.OS === "web") return;
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Kümesinden haber var! \uD83D\uDC23",
        body: `Kümesinden haber var: Yeni bir bebek geliyor! (${batchName})`,
        sound: true,
      },
      trigger: null,
    });
  } catch (_) {}
}

export function IncubationProvider({ children }: { children: React.ReactNode }) {
  const [batches, setBatches] = useState<IncubationBatch[]>([]);

  useEffect(() => {
    if (Platform.OS !== "web") {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }

    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setBatches(JSON.parse(raw));
      } catch (_) {}
    };
    load();
  }, []);

  useEffect(() => {
    batches.forEach(async (batch) => {
      if (batch.status === "active" && !batch.notificationSent) {
        const progress = getProgress(batch);
        if (progress >= 1) {
          await sendHatchNotification(batch.birdName);
          const updated = batches.map((b) =>
            b.id === batch.id ? { ...b, notificationSent: true } : b
          );
          setBatches(updated);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
      }
    });
  }, [batches]);

  const save = async (updated: IncubationBatch[]) => {
    setBatches(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const addBatch = async (batch: Omit<IncubationBatch, "id">) => {
    const newBatch: IncubationBatch = {
      ...batch,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    await save([...batches, newBatch]);
  };

  const updateBatch = async (id: string, updates: Partial<IncubationBatch>) => {
    await save(batches.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const deleteBatch = async (id: string) => {
    await save(batches.filter((b) => b.id !== id));
  };

  const getDaysRemaining = (batch: IncubationBatch) => {
    const start = new Date(batch.startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + batch.incubationDays);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const getProgress = (batch: IncubationBatch) => {
    const start = new Date(batch.startDate);
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(1, Math.max(0, elapsed / batch.incubationDays));
  };

  const getTurkishStatus = (batch: IncubationBatch): TurkishStatus => {
    if (batch.status === "hatched") return "Çıktı";
    if (batch.status === "failed") return "Başarısız";
    const progress = getProgress(batch);
    if (progress >= 0.8) return "Çıkım Bekleniyor";
    return "Yumurtada";
  };

  const clearAll = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setBatches([]);
  };

  return (
    <IncubationContext.Provider
      value={{ batches, addBatch, updateBatch, deleteBatch, getDaysRemaining, getProgress, getTurkishStatus, clearAll }}
    >
      {children}
    </IncubationContext.Provider>
  );
}

export const useIncubation = () => useContext(IncubationContext);
