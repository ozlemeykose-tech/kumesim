import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { ChecklistTask, getTurkeyTodayISO, useChecklist } from "@/context/ChecklistContext";
import { useColors } from "@/hooks/useColors";
import { ScreenHeader } from "@/components/ScreenHeader";

const CATEGORIES: ChecklistTask["category"][] = [
  "feeding", "health", "cleaning", "breeding", "other",
];

const CATEGORY_LABELS: Record<ChecklistTask["category"], string> = {
  feeding: "Besleme",
  health: "Sağlık",
  cleaning: "Temizlik",
  breeding: "Üreme",
  other: "Diğer",
};

const CATEGORY_COLORS: Record<ChecklistTask["category"], string> = {
  feeding: "#22c55e",
  health: "#3b82f6",
  cleaning: "#f59e0b",
  breeding: "#ec4899",
  other: "#8b5cf6",
};

const CATEGORY_ICONS: Record<ChecklistTask["category"], string> = {
  feeding: "food",
  health: "heart-pulse",
  cleaning: "broom",
  breeding: "egg",
  other: "dots-horizontal",
};

// HARDCODED Turkish day abbreviations — never derived from locale to avoid translation bugs
const DAY_LABELS: readonly string[] = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"] as const;

// Compute the 7 days of the current week (Mon..Sun) anchored on Turkey time (UTC+3)
function getWeekDayDates(): { label: string; date: number; iso: string }[] {
  // Today as YYYY-MM-DD in Istanbul
  const todayISO = getTurkeyTodayISO();
  const [y, m, d] = todayISO.split("-").map(Number);

  // Compute weekday (0=Sun..6=Sat) from a UTC-anchored date — safe across timezones
  const todayUTC = new Date(Date.UTC(y, m - 1, d));
  const wd = todayUTC.getUTCDay(); // 0=Sun..6=Sat
  const diffToMonday = wd === 0 ? -6 : 1 - wd;

  const mondayUTC = new Date(todayUTC);
  mondayUTC.setUTCDate(todayUTC.getUTCDate() + diffToMonday);

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(mondayUTC);
    day.setUTCDate(mondayUTC.getUTCDate() + i);
    const iso = `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, "0")}-${String(day.getUTCDate()).padStart(2, "0")}`;
    return {
      label: DAY_LABELS[i], // hardcoded constant — never auto-translated
      date: day.getUTCDate(),
      iso,
    };
  });
}

function TaskRow({ task, onDelete }: { task: ChecklistTask; onDelete: () => void }) {
  const colors = useColors();
  const { toggleTask } = useChecklist();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(task.completed ? 1 : 0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const checkStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const handleToggle = async () => {
    scale.value = withSpring(0.95, {}, () => { scale.value = withSpring(1); });
    opacity.value = withTiming(task.completed ? 0 : 1, { duration: 180 });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleTask(task.id);
  };

  const catColor = CATEGORY_COLORS[task.category];

  const styles = StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 13,
      marginBottom: 10,
      gap: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    checkBox: {
      width: 26, height: 26, borderRadius: 8,
      borderWidth: 2,
      borderColor: task.completed ? colors.primary : colors.border,
      backgroundColor: task.completed ? colors.primary : "transparent",
      alignItems: "center", justifyContent: "center",
    },
    labelText: {
      flex: 1, fontSize: 15, fontFamily: "Inter_500Medium",
      color: task.completed ? colors.mutedForeground : colors.foreground,
      textDecorationLine: task.completed ? "line-through" : "none",
    },
    catDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: catColor },
    delBtn: { padding: 6, borderRadius: 8 },
  });

  return (
    <Animated.View style={animStyle}>
      <View style={styles.row}>
        <Pressable
          style={styles.checkBox}
          onPress={handleToggle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Animated.View style={checkStyle}>
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          </Animated.View>
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={handleToggle}>
          <Text style={styles.labelText}>{task.label}</Text>
        </Pressable>
        <View style={styles.catDot} />
        <Pressable
          style={styles.delBtn}
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

function HistoryModal({
  visible,
  dayLabel,
  isoDate,
  onClose,
}: {
  visible: boolean;
  dayLabel: string;
  isoDate: string;
  onClose: () => void;
}) {
  const colors = useColors();
  const { getTasksForDate } = useChecklist();
  const dayTasks = getTasksForDate(isoDate);
  const doneCount = dayTasks.filter((t) => t.done).length;

  const [d, m, y] = [
    new Date(isoDate).getDate(),
    new Date(isoDate).toLocaleDateString("tr-TR", { month: "long" }),
    new Date(isoDate).getFullYear(),
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={hist.overlay} onPress={onClose}>
        <Pressable style={[hist.card, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
          <View style={[hist.handle, { backgroundColor: colors.border }]} />
          <Text style={[hist.title, { color: colors.foreground }]}>
            {dayLabel} — {d} {m} {y}
          </Text>
          <Text style={[hist.sub, { color: colors.mutedForeground }]}>
            {doneCount}/{dayTasks.length} görev tamamlandı
          </Text>
          <ScrollView style={{ maxHeight: 340 }}>
            {dayTasks.map(({ task, done }) => (
              <View key={task.id} style={[hist.row, { borderBottomColor: colors.border }]}>
                <View style={[hist.dot, { backgroundColor: done ? "#22c55e" : colors.border }]}>
                  {done && <Ionicons name="checkmark" size={11} color="#fff" />}
                </View>
                <Text style={[hist.taskText, { color: done ? colors.foreground : colors.mutedForeground }]}>
                  {task.label}
                </Text>
              </View>
            ))}
          </ScrollView>
          <Pressable style={[hist.closeBtn, { backgroundColor: colors.primary }]} onPress={onClose}>
            <Text style={hist.closeBtnText}>Kapat</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const hist = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  card: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 4 },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 16 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 11, borderBottomWidth: 1,
  },
  dot: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  taskText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  closeBtn: { borderRadius: 14, paddingVertical: 13, alignItems: "center", marginTop: 16 },
  closeBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15, fontWeight: "700" },
});

export default function ChecklistScreen() {
  const colors = useColors();
  const { tasks, addTask, deleteTask } = useChecklist();
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newCat, setNewCat] = useState<ChecklistTask["category"]>("other");
  const [historyDay, setHistoryDay] = useState<{ label: string; iso: string } | null>(null);

  const weekDays = getWeekDayDates();
  const todayISO = getTurkeyTodayISO();
  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const pct = total > 0 ? completed / total : 0;

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    await addTask(newLabel.trim(), newCat);
    setNewLabel(""); setNewCat("other"); setShowAdd(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Immediate delete — no confirmation dialog
  const handleDelete = async (task: ChecklistTask) => {
    await deleteTask(task.id);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  // Any day is clickable — opens the day's routine view
  const handleDayPress = (day: { label: string; iso: string }) => {
    setHistoryDay(day);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerRow: {
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 8,
      flexDirection: "row", alignItems: "center", gap: 12,
    },
    screenTitle: {
      fontSize: 24, fontWeight: "700", fontFamily: "Inter_700Bold", color: colors.foreground, flex: 1,
    },
    weekRow: { flexDirection: "row", paddingHorizontal: 20, marginBottom: 16, gap: 6 },
    dayItem: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 10 },
    dayItemToday: { backgroundColor: colors.primary },
    dayItemPast: { backgroundColor: colors.secondary },
    dayLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: colors.mutedForeground, marginBottom: 4 },
    dayLabelToday: { color: "rgba(255,255,255,0.8)" },
    dayLabelPast: { color: colors.primary },
    dayNum: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold", color: colors.foreground },
    dayNumToday: { color: "#FFFFFF" },
    dayNumPast: { color: colors.primary },
    progressCard: {
      backgroundColor: colors.primary, borderRadius: 20, padding: 20,
      marginHorizontal: 20, marginBottom: 18,
    },
    progressTitle: { fontSize: 14, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_500Medium", marginBottom: 4 },
    progressCount: { fontSize: 28, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold" },
    progressSub: { fontSize: 13, color: "rgba(255,255,255,0.65)", fontFamily: "Inter_400Regular", marginBottom: 14 },
    progressBarBg: { height: 8, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 4, overflow: "hidden" },
    progressBarFill: { height: 8, borderRadius: 4, backgroundColor: "#FFFFFF", width: `${Math.round(pct * 100)}%` },
    listContent: { paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 100 : 120 },
    fab: {
      position: "absolute", right: 20, bottom: Platform.OS === "web" ? 100 : 100,
      width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary,
      alignItems: "center", justifyContent: "center",
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
    },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modalCard: {
      backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, paddingBottom: 40,
    },
    modalTitle: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold", color: colors.foreground, marginBottom: 16 },
    modalInput: {
      backgroundColor: colors.muted, borderRadius: 12, padding: 14,
      fontSize: 15, fontFamily: "Inter_400Regular", color: colors.foreground, marginBottom: 16,
    },
    catRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
    catChip: { flexDirection: "row", alignItems: "center", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, gap: 4, borderWidth: 1.5 },
    catChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    addBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: "center" },
    addBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
    empty: { alignItems: "center", paddingVertical: 40 },
    emptyText: { fontSize: 15, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 12 },
  });

  return (
    <View style={styles.container}>
      <ScreenHeader active="checklist" />
      <View style={styles.headerRow}>
        <Text style={styles.screenTitle}>Haftalık Rutin</Text>
      </View>

      <View style={styles.weekRow}>
        {weekDays.map((day, i) => {
          const isToday = day.iso === todayISO;
          const isPast = day.iso < todayISO;
          return (
            <Pressable
              key={i}
              style={[styles.dayItem, isToday && styles.dayItemToday, isPast && !isToday && styles.dayItemPast]}
              onPress={() => handleDayPress(day)}
            >
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday, isPast && !isToday && styles.dayLabelPast]}>
                {day.label}
              </Text>
              <Text style={[styles.dayNum, isToday && styles.dayNumToday, isPast && !isToday && styles.dayNumPast]}>
                {day.date}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Bu Haftanın İlerlemesi</Text>
        <Text style={styles.progressCount}>{completed}/{total}</Text>
        <Text style={styles.progressSub}>görev tamamlandı — Her Pazar 00:00'da sıfırlanır</Text>
        <View style={styles.progressBarBg}>
          <View style={styles.progressBarFill} />
        </View>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskRow task={item} onDelete={() => handleDelete(item)} />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="clipboard-outline" size={40} color={colors.mutedForeground} />
            <Text style={styles.emptyText}>Henüz görev yok.</Text>
          </View>
        }
      />

      <Pressable style={styles.fab} onPress={() => setShowAdd(true)}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAdd(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Görev Ekle</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Görev açıklaması..."
              placeholderTextColor={colors.mutedForeground}
              value={newLabel}
              onChangeText={setNewLabel}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            <View style={styles.catRow}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  style={[
                    styles.catChip,
                    { backgroundColor: newCat === cat ? CATEGORY_COLORS[cat] + "20" : "transparent", borderColor: newCat === cat ? CATEGORY_COLORS[cat] : colors.border },
                  ]}
                  onPress={() => setNewCat(cat)}
                >
                  <MaterialCommunityIcons name={CATEGORY_ICONS[cat] as any} size={14} color={newCat === cat ? CATEGORY_COLORS[cat] : colors.mutedForeground} />
                  <Text style={[styles.catChipText, { color: newCat === cat ? CATEGORY_COLORS[cat] : colors.mutedForeground }]}>
                    {CATEGORY_LABELS[cat]}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={[styles.addBtn, !newLabel.trim() && { opacity: 0.5 }]} onPress={handleAdd} disabled={!newLabel.trim()}>
              <Text style={styles.addBtnText}>Görev Ekle</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {historyDay && (
        <HistoryModal
          visible={!!historyDay}
          dayLabel={historyDay.label}
          isoDate={historyDay.iso}
          onClose={() => setHistoryDay(null)}
        />
      )}
    </View>
  );
}
