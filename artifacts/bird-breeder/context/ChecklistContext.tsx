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
  { id: "tk1", label: "Yem/su", category: "feeding" },
  { id: "tk2", label: "Kafes Temizliği", category: "cleaning" },
  { id: "tk3", label: "Mama Desteği", category: "feeding" },
  { id: "tk4", label: "Vitamin Takviyesi", category: "health" },
  { id: "tk5", label: "Genel Sağlık Kontrolü", category: "health" },
  { id: "tk6", label: "Isı/Nem Dengesi", category: "other" },
  { id: "tk7", label: "Havalandırma/Hava Kalitesi", category: "other" },
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

const STORAGE_KEY = "checklist_data_v4";
const WEEK_KEY = "checklist_week_v4";

// Turkey timezone (UTC+3, no DST) — fixed for the entire app
export const TURKEY_TZ = "Europe/Istanbul";

// Get today's date as YYYY-MM-DD in Turkey time, regardless of device timezone
export function getTurkeyTodayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TURKEY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getISOWeekKey(): string {
  const todayISO = getTurkeyTodayISO();
  const [y, m, d] = todayISO.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
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

        if (savedWeek !== currentWeek || !raw) {
          // New week OR fresh install: seed with the canonical 7 tasks
          const existing = raw ? JSON.parse(raw) as ChecklistTask[] : null;
          const seeded = DEFAULT_TASKS.map((t) => {
            const prev = existing?.find((e) => e.id === t.id);
            return {
              ...t,
              completed: false,
              completedDates: prev?.completedDates ?? [],
            };
          });
          // Preserve user-added custom tasks (those whose id is NOT in DEFAULT_TASKS)
          const defaultIds = new Set(DEFAULT_TASKS.map((t) => t.id));
          const customs = (existing ?? []).filter((t) => !defaultIds.has(t.id))
            .map((t) => ({ ...t, completed: false, completedDates: t.completedDates ?? [] }));
          const final = [...seeded, ...customs];
          setTasks(final);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(final));
          await AsyncStorage.setItem(WEEK_KEY, currentWeek);
        } else {
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

  const todayISO = () => getTurkeyTodayISO();

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
