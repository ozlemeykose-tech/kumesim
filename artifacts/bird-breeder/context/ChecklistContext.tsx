import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface ChecklistTask {
  id: string;
  label: string;
  category: "feeding" | "health" | "cleaning" | "breeding" | "other";
  completed: boolean;
}

const DEFAULT_TASKS: Omit<ChecklistTask, "completed">[] = [
  { id: "t1", label: "Morning feeding", category: "feeding" },
  { id: "t2", label: "Evening feeding", category: "feeding" },
  { id: "t3", label: "Fresh water change", category: "feeding" },
  { id: "t4", label: "Check egg incubation", category: "breeding" },
  { id: "t5", label: "Clean cages", category: "cleaning" },
  { id: "t6", label: "Health check — observe birds", category: "health" },
  { id: "t7", label: "Record observations/notes", category: "other" },
  { id: "t8", label: "Supplement vitamins", category: "health" },
  { id: "t9", label: "Spot clean aviary", category: "cleaning" },
  { id: "t10", label: "Check nesting boxes", category: "breeding" },
];

interface ChecklistContextType {
  tasks: ChecklistTask[];
  toggleTask: (id: string) => Promise<void>;
  addTask: (label: string, category: ChecklistTask["category"]) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  weekLabel: string;
  resetDue: boolean;
}

const ChecklistContext = createContext<ChecklistContextType>({
  tasks: [],
  toggleTask: async () => {},
  addTask: async () => {},
  deleteTask: async () => {},
  weekLabel: "",
  resetDue: false,
});

const STORAGE_KEY = "checklist_data";
const WEEK_KEY = "checklist_week";

function getWeekString() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return `${monday.getFullYear()}-W${Math.ceil(monday.getDate() / 7)}`;
}

export function ChecklistProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<ChecklistTask[]>(
    DEFAULT_TASKS.map((t) => ({ ...t, completed: false }))
  );
  const [weekLabel, setWeekLabel] = useState("");
  const [resetDue, setResetDue] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const currentWeek = getWeekString();
        const savedWeek = await AsyncStorage.getItem(WEEK_KEY);
        const raw = await AsyncStorage.getItem(STORAGE_KEY);

        if (savedWeek !== currentWeek) {
          const now = new Date();
          const isSundayNight = now.getDay() === 0 && now.getHours() >= 20;
          if (isSundayNight || savedWeek !== currentWeek) {
            const reset = DEFAULT_TASKS.map((t) => ({ ...t, completed: false }));
            setTasks(reset);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
            await AsyncStorage.setItem(WEEK_KEY, currentWeek);
            setResetDue(false);
          }
        } else if (raw) {
          setTasks(JSON.parse(raw));
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

  const toggleTask = async (id: string) => {
    await save(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const addTask = async (label: string, category: ChecklistTask["category"]) => {
    const newTask: ChecklistTask = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      label,
      category,
      completed: false,
    };
    await save([...tasks, newTask]);
  };

  const deleteTask = async (id: string) => {
    await save(tasks.filter((t) => t.id !== id));
  };

  return (
    <ChecklistContext.Provider
      value={{ tasks, toggleTask, addTask, deleteTask, weekLabel, resetDue }}
    >
      {children}
    </ChecklistContext.Provider>
  );
}

export const useChecklist = () => useContext(ChecklistContext);
