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
  notificationScheduled?: boolean;
}

export const SPECIES_LIST: { label: string; days: number }[] = [
  { label: "Muhabbet Kuşu", days: 18 },
  { label: "Sultan Papağanı", days: 20 },
  { label: "Kanarya", days: 14 },
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

function storageKey(email: string | null) {
  return email ? `incubation_v3_${email}` : "incubation_v3_guest";
}

// Schedule a local notification for 1 day before the hatch date.
async function scheduleHatchAlert(batchName: string, hatchDate: Date) {
  if (Platform.OS === "web") return;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    const triggerDate = new Date(hatchDate);
    triggerDate.setDate(triggerDate.getDate() - 1); // 1 day before
    triggerDate.setHours(9, 0, 0, 0); // 09:00 morning

    // Only schedule if the trigger is still in the future
    if (triggerDate <= new Date()) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Müjde! 🐣",
        body: `Kümesinden haber ver, yumurtanı kontrol et! (${batchName})`,
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
    });
  } catch (_) {}
}

export function IncubationProvider({
  userEmail,
  children,
}: {
  userEmail: string | null;
  children: React.ReactNode;
}) {
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
  }, []);

  // Reload when user changes — each account sees only their own records
  useEffect(() => {
    setBatches([]);
    AsyncStorage.getItem(storageKey(userEmail)).then((raw) => {
      if (raw) setBatches(JSON.parse(raw));
    }).catch(() => {});
  }, [userEmail]);

  const save = async (updated: IncubationBatch[]) => {
    setBatches(updated);
    await AsyncStorage.setItem(storageKey(userEmail), JSON.stringify(updated));
  };

  const addBatch = async (batch: Omit<IncubationBatch, "id">) => {
    const newBatch: IncubationBatch = {
      ...batch,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      notificationScheduled: false,
    };

    // Calculate hatch date and schedule the 1-day-before notification
    const start = new Date(newBatch.startDate);
    const hatchDate = new Date(start);
    hatchDate.setDate(hatchDate.getDate() + newBatch.incubationDays);
    await scheduleHatchAlert(newBatch.birdName, hatchDate);

    await save([...batches, { ...newBatch, notificationScheduled: true }]);
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
    if (getProgress(batch) >= 0.8) return "Çıkım Bekleniyor";
    return "Yumurtada";
  };

  const clearAll = async () => {
    await AsyncStorage.removeItem(storageKey(userEmail));
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
