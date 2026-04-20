import React, { createContext, useContext, useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { auth, db } from "@/lib/firebase";

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

export type TurkishStatus =
  | "Yumurtada"
  | "Çıkım Bekleniyor"
  | "Çıktı"
  | "Başarısız";

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

async function scheduleHatchAlert(batchName: string, hatchDate: Date) {
  if (Platform.OS === "web") return;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;
    const triggerDate = new Date(hatchDate);
    triggerDate.setDate(triggerDate.getDate() - 1);
    triggerDate.setHours(9, 0, 0, 0);
    if (triggerDate <= new Date()) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Müjde! 🐣",
        body: `Kümesinden haber ver, yumurtanı kontrol et! (${batchName})`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });
  } catch {}
}

export function IncubationProvider({ children }: { children: React.ReactNode }) {
  const [batches, setBatches] = useState<IncubationBatch[]>([]);
  const [uid, setUid] = useState<string | null>(null);

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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid ?? null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!uid) {
      setBatches([]);
      return;
    }
    const col = collection(db, "users", uid, "incubations");
    const unsub = onSnapshot(col, (snap) => {
      setBatches(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as IncubationBatch))
      );
    });
    return unsub;
  }, [uid]);

  const addBatch = async (batch: Omit<IncubationBatch, "id">): Promise<void> => {
    if (!uid) return;
    const col = collection(db, "users", uid, "incubations");
    const docRef = await addDoc(col, batch);
    await updateDoc(docRef, { id: docRef.id, notificationScheduled: true });

    const start = new Date(batch.startDate);
    const hatchDate = new Date(start);
    hatchDate.setDate(hatchDate.getDate() + batch.incubationDays);
    await scheduleHatchAlert(batch.birdName, hatchDate);
  };

  const updateBatch = async (
    id: string,
    updates: Partial<IncubationBatch>
  ): Promise<void> => {
    if (!uid) return;
    await updateDoc(doc(db, "users", uid, "incubations", id), updates);
  };

  const deleteBatch = async (id: string): Promise<void> => {
    if (!uid) return;
    await deleteDoc(doc(db, "users", uid, "incubations", id));
  };

  const clearAll = async (): Promise<void> => {
    if (!uid) return;
    const col = collection(db, "users", uid, "incubations");
    const snap = await getDocs(col);
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  };

  const getDaysRemaining = (batch: IncubationBatch) => {
    const end = new Date(batch.startDate);
    end.setDate(end.getDate() + batch.incubationDays);
    const diff = Math.ceil((end.getTime() - Date.now()) / 86400000);
    return Math.max(0, diff);
  };

  const getProgress = (batch: IncubationBatch) => {
    const elapsed = Math.floor(
      (Date.now() - new Date(batch.startDate).getTime()) / 86400000
    );
    return Math.min(1, Math.max(0, elapsed / batch.incubationDays));
  };

  const getTurkishStatus = (batch: IncubationBatch): TurkishStatus => {
    if (batch.status === "hatched") return "Çıktı";
    if (batch.status === "failed") return "Başarısız";
    if (getProgress(batch) >= 0.8) return "Çıkım Bekleniyor";
    return "Yumurtada";
  };

  return (
    <IncubationContext.Provider
      value={{
        batches,
        addBatch,
        updateBatch,
        deleteBatch,
        getDaysRemaining,
        getProgress,
        getTurkishStatus,
        clearAll,
      }}
    >
      {children}
    </IncubationContext.Provider>
  );
}

export const useIncubation = () => useContext(IncubationContext);
