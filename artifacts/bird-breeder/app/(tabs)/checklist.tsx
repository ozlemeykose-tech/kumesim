import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
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

import { ChecklistTask, useChecklist } from "@/context/ChecklistContext";
import { useColors } from "@/hooks/useColors";

const CATEGORIES: ChecklistTask["category"][] = [
  "feeding",
  "health",
  "cleaning",
  "breeding",
  "other",
];

const CATEGORY_LABELS: Record<ChecklistTask["category"], string> = {
  feeding: "Besleme",
  health: "Saglik",
  cleaning: "Temizlik",
  breeding: "Ureme",
  other: "Diger",
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

function TaskRow({ task }: { task: ChecklistTask }) {
  const colors = useColors();
  const { toggleTask } = useChecklist();
  const scale = useSharedValue(1);
  const checkOpacity = useSharedValue(task.completed ? 1 : 0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
  }));

  const handleToggle = async () => {
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    checkOpacity.value = withTiming(task.completed ? 0 : 1, { duration: 180 });
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
      padding: 14,
      marginBottom: 10,
      gap: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 2,
    },
    checkBox: {
      width: 26,
      height: 26,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: task.completed ? colors.primary : colors.border,
      backgroundColor: task.completed ? colors.primary : "transparent",
      alignItems: "center",
      justifyContent: "center",
    },
    label: {
      flex: 1,
      fontSize: 15,
      fontFamily: "Inter_500Medium",
      color: task.completed ? colors.mutedForeground : colors.foreground,
      textDecorationLine: task.completed ? "line-through" : "none",
    },
    catDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: catColor,
    },
  });

  return (
    <Animated.View style={animStyle}>
      <Pressable style={styles.row} onPress={handleToggle}>
        <View style={styles.checkBox}>
          <Animated.View style={checkStyle}>
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          </Animated.View>
        </View>
        <Text style={styles.label}>{task.label}</Text>
        <View style={styles.catDot} />
      </Pressable>
    </Animated.View>
  );
}

export default function ChecklistScreen() {
  const colors = useColors();
  const { tasks, addTask } = useChecklist();
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newCat, setNewCat] = useState<ChecklistTask["category"]>("other");

  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const pct = total > 0 ? completed / total : 0;

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    await addTask(newLabel.trim(), newCat);
    setNewLabel("");
    setNewCat("other");
    setShowAdd(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "web" ? 80 : 16,
      paddingBottom: 16,
    },
    screenTitle: {
      fontSize: 26,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      marginBottom: 2,
    },
    weekLabel: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    progressCard: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      padding: 20,
      marginHorizontal: 20,
      marginBottom: 20,
    },
    progressTitle: {
      fontSize: 14,
      color: "rgba(255,255,255,0.75)",
      fontFamily: "Inter_500Medium",
      marginBottom: 4,
    },
    progressCount: {
      fontSize: 28,
      fontWeight: "700" as const,
      color: "#FFFFFF",
      fontFamily: "Inter_700Bold",
    },
    progressSub: {
      fontSize: 13,
      color: "rgba(255,255,255,0.7)",
      fontFamily: "Inter_400Regular",
      marginBottom: 14,
    },
    progressBarBg: {
      height: 8,
      backgroundColor: "rgba(255,255,255,0.25)",
      borderRadius: 4,
      overflow: "hidden",
    },
    progressBarFill: {
      height: 8,
      borderRadius: 4,
      backgroundColor: "#FFFFFF",
      width: `${Math.round(pct * 100)}%`,
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === "web" ? 100 : 120,
    },
    fab: {
      position: "absolute",
      right: 20,
      bottom: Platform.OS === "web" ? 100 : 100,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 6,
    },
    empty: { alignItems: "center", paddingVertical: 40 },
    emptyText: {
      fontSize: 15,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 12,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalCard: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      marginBottom: 16,
    },
    modalInput: {
      backgroundColor: colors.muted,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: colors.foreground,
      marginBottom: 16,
    },
    catRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
    catChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      gap: 4,
      borderWidth: 1.5,
    },
    catChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    addBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
    },
    addBtnText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Haftalik Liste</Text>
        <Text style={styles.weekLabel}>Her Pazar 00:00'da sifirlanir</Text>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Bu haftanin ilerlemesi</Text>
        <Text style={styles.progressCount}>{completed}/{total}</Text>
        <Text style={styles.progressSub}>gorev tamamlandi</Text>
        <View style={styles.progressBarBg}>
          <View style={styles.progressBarFill} />
        </View>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TaskRow task={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="clipboard-outline" size={40} color={colors.mutedForeground} />
            <Text style={styles.emptyText}>Henuz gorev yok. Ilk gorevi ekleyin.</Text>
          </View>
        }
        scrollEnabled
      />

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.8 }]}
        onPress={() => setShowAdd(true)}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAdd(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Gorev Ekle</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Gorev aciklamasi..."
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
                    {
                      backgroundColor: newCat === cat ? CATEGORY_COLORS[cat] + "20" : "transparent",
                      borderColor: newCat === cat ? CATEGORY_COLORS[cat] : colors.border,
                    },
                  ]}
                  onPress={() => setNewCat(cat)}
                >
                  <MaterialCommunityIcons
                    name={CATEGORY_ICONS[cat] as any}
                    size={14}
                    color={newCat === cat ? CATEGORY_COLORS[cat] : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.catChipText,
                      { color: newCat === cat ? CATEGORY_COLORS[cat] : colors.mutedForeground },
                    ]}
                  >
                    {CATEGORY_LABELS[cat]}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={[styles.addBtn, !newLabel.trim() && { opacity: 0.5 }]}
              onPress={handleAdd}
              disabled={!newLabel.trim()}
            >
              <Text style={styles.addBtnText}>Gorev Ekle</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
