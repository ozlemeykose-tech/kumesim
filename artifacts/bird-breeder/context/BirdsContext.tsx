import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface Bird {
  id: string;
  name: string;
  ringNo: string;
  breed: string;
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
  addBird: (bird: Omit<Bird, "id">) => Promise<void>;
  updateBird: (id: string, updates: Partial<Bird>) => Promise<void>;
  deleteBird: (id: string) => Promise<void>;
}

const BirdsContext = createContext<BirdsContextType>({
  birds: [],
  addBird: async () => {},
  updateBird: async () => {},
  deleteBird: async () => {},
});

const STORAGE_KEY = "birds_data";

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

  const addBird = async (bird: Omit<Bird, "id">) => {
    const newBird: Bird = {
      ...bird,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };
    await save([...birds, newBird]);
  };

  const updateBird = async (id: string, updates: Partial<Bird>) => {
    await save(birds.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const deleteBird = async (id: string) => {
    await save(birds.filter((b) => b.id !== id));
  };

  return (
    <BirdsContext.Provider value={{ birds, addBird, updateBird, deleteBird }}>
      {children}
    </BirdsContext.Provider>
  );
}

export const useBirds = () => useContext(BirdsContext);
