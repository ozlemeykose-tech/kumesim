import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface IncubationBatch {
  id: string;
  birdId?: string;
  birdName: string;
  breed: string;
  eggCount: number;
  startDate: string;
  incubationDays: number;
  notes?: string;
  status: "active" | "hatched" | "failed";
}

interface IncubationContextType {
  batches: IncubationBatch[];
  addBatch: (batch: Omit<IncubationBatch, "id">) => Promise<void>;
  updateBatch: (id: string, updates: Partial<IncubationBatch>) => Promise<void>;
  deleteBatch: (id: string) => Promise<void>;
  getDaysRemaining: (batch: IncubationBatch) => number;
  getProgress: (batch: IncubationBatch) => number;
}

const IncubationContext = createContext<IncubationContextType>({
  batches: [],
  addBatch: async () => {},
  updateBatch: async () => {},
  deleteBatch: async () => {},
  getDaysRemaining: () => 0,
  getProgress: () => 0,
});

const STORAGE_KEY = "incubation_data";

export function IncubationProvider({ children }: { children: React.ReactNode }) {
  const [batches, setBatches] = useState<IncubationBatch[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setBatches(JSON.parse(raw));
      } catch (_) {}
    };
    load();
  }, []);

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

  return (
    <IncubationContext.Provider
      value={{ batches, addBatch, updateBatch, deleteBatch, getDaysRemaining, getProgress }}
    >
      {children}
    </IncubationContext.Provider>
  );
}

export const useIncubation = () => useContext(IncubationContext);
