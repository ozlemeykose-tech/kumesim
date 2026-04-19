import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export const MAX_BIRDS = 25;

export interface Bird {
  id: string;
  name: string;
  ringNo: string;
  breed: string;
  species: string;
  gender: "male" | "female" | "unknown";
  fatherId?: string;
  motherId?: string;
  imageUri?: string;
  dateOfBirth?: string;
  notes?: string;
  color?: string;
}

interface BirdsContextType {
  birds: Bird[];
  canAddBird: boolean;
  addBird: (bird: Omit<Bird, "id">) => Promise<{ success: boolean; reason?: string }>;
  updateBird: (id: string, updates: Partial<Bird>) => Promise<void>;
  deleteBird: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const BirdsContext = createContext<BirdsContextType>({
  birds: [],
  canAddBird: true,
  addBird: async () => ({ success: false }),
  updateBird: async () => {},
  deleteBird: async () => {},
  clearAll: async () => {},
});

const STORAGE_KEY = "birds_data_v2";

export function BirdsProvider({ children }: { children: React.ReactNode }) {
  const [birds, setBirds] = useState<Bird[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setBirds(JSON.parse(raw));
      } catch (_) {}
    };
    load();
  }, []);

  const save = async (updated: Bird[]) => {
    setBirds(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const canAddBird = birds.length < MAX_BIRDS;

  const addBird = async (bird: Omit<Bird, "id">) => {
    if (birds.length >= MAX_BIRDS) {
      return { success: false, reason: `En fazla ${MAX_BIRDS} kuş eklenebilir.` };
    }
    const newBird: Bird = {
      ...bird,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    await save([...birds, newBird]);
    return { success: true };
  };

  const updateBird = async (id: string, updates: Partial<Bird>) => {
    await save(birds.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const deleteBird = async (id: string) => {
    await save(birds.filter((b) => b.id !== id));
  };

  const clearAll = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setBirds([]);
  };

  return (
    <BirdsContext.Provider value={{ birds, canAddBird, addBird, updateBird, deleteBird, clearAll }}>
      {children}
    </BirdsContext.Provider>
  );
}

export const useBirds = () => useContext(BirdsContext);
