import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface ChecklistTask {
  id: string;
  label: string;
  category: "feeding" | "health" | "cleaning" | "breeding" | "other";
  completed: boolean;
  completedDates: string[];
}

const DEFAULT_TASKS: Omit<ChecklistTask, "completed" | "completedDates">[] = [
  { id: "t1", label: "Sabah yemi verme", category: "feeding" },
  { id: "t2", label: "Akşam yemi verme", category: "feeding" },
  { id: "t3", label: "Taze Su değiştirme", category: "feeding" },
  { id: "t4", label: "Yumurta kontrolü", category: "breeding" },
  { id: "t5", label: "Kafes temizleme", category: "cleaning" },
  { id: "t6", label: "Sağlık kontrolü", category: "health" },
  { id: "t7", label: "Not ve gözlem kayıt", category: "other" },
  { id: "t8", label: "Vitamin takviyesi", category: "health" },
  { id: "t9", label: "Uçuş alanı temizliği", category: "cleaning" },
  { id: "t10", label: "Yuva kutusu kontrolü", category: "breeding" },
];

interface ChecklistContextType {
  tasks: ChecklistTask[];
  toggleTask: (id: string) => Promise<void>;
  addTask: (label: string, category: ChecklistTask["category"]) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  weekLabel: string;
  clearAll: () => Promise<void>;
  getTasksForDate: (isoDate: string) => { task: ChecklistTask; done: boolean }[];
}

const ChecklistContext = createContext<ChecklistContextType>({
  tasks: [],
  toggleTask: async () => {},
  addTask: async () => {},
  deleteTask: async () => {},
  weekLabel: "",
  clearAll: async () => {},
  getTasksForDate: () => [],
});

const STORAGE_KEY = "checklist_data_v3";
const WEEK_KEY = "checklist_week_v3";

function getISOWeekKey(): string {
  const now = new Date();
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${weekNo}`;
}

export function ChecklistProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<ChecklistTask[]>(
    DEFAULT_TASKS.map((t) => ({ ...t, completed: false, completedDates: [] }))
  );
  const [weekLabel, setWeekLabel] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const currentWeek = getISOWeekKey();
        const savedWeek = await AsyncStorage.getItem(WEEK_KEY);
        const raw = await AsyncStorage.getItem(STORAGE_KEY);

        if (savedWeek !== currentWeek) {
          const existing = raw ? JSON.parse(raw) as ChecklistTask[] : null;
          const reset = DEFAULT_TASKS.map((t) => {
            const prev = existing?.find((e) => e.id === t.id);
            return {
              ...t,
              completed: false,
              completedDates: prev?.completedDates ?? [],
            };
          });
          setTasks(reset);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
          await AsyncStorage.setItem(WEEK_KEY, currentWeek);
        } else if (raw) {
          const parsed = JSON.parse(raw) as ChecklistTask[];
          const migrated = parsed.map((t) => ({ ...t, completedDates: t.completedDates ?? [] }));
          setTasks(migrated);
        }
        setWeekLabel(currentWeek);
      } catch (_) {}
    };
    load();
  }, []);

  const save = async (updated: ChecklistTask[]) => {
    setTasks(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const todayISO = () => new Date().toISOString().split("T")[0];

  const toggleTask = async (id: string) => {
    const today = todayISO();
    await save(
      tasks.map((t) => {
        if (t.id !== id) return t;
        const isCompleting = !t.completed;
        const dates = t.completedDates ?? [];
        return {
          ...t,
          completed: isCompleting,
          completedDates: isCompleting
            ? [...new Set([...dates, today])]
            : dates.filter((d) => d !== today),
        };
      })
    );
  };

  const addTask = async (label: string, category: ChecklistTask["category"]) => {
    const newTask: ChecklistTask = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      label,
      category,
      completed: false,
      completedDates: [],
    };
    await save([...tasks, newTask]);
  };

  const deleteTask = async (id: string) => {
    await save(tasks.filter((t) => t.id !== id));
  };

  const getTasksForDate = (isoDate: string) =>
    tasks.map((t) => ({ task: t, done: (t.completedDates ?? []).includes(isoDate) }));

  const clearAll = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(WEEK_KEY);
    setTasks(DEFAULT_TASKS.map((t) => ({ ...t, completed: false, completedDates: [] })));
  };

  return (
    <ChecklistContext.Provider
      value={{ tasks, toggleTask, addTask, deleteTask, weekLabel, clearAll, getTasksForDate }}
    >
      {children}
    </ChecklistContext.Provider>
  );
}

export const useChecklist = () => useContext(ChecklistContext);
