import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useBirds } from "@/context/BirdsContext";
import { useChecklist } from "@/context/ChecklistContext";
import { useIncubation } from "@/context/IncubationContext";

type GridItemType = {
  id: string;
  label: string;
  icon: string;
  iconFamily: "ion" | "mci";
  color: string;
  bg: string;
  badge?: number;
  action: () => void;
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { userEmail } = useAuth();
  const { birds } = useBirds();
  const { tasks } = useChecklist();
  const { batches } = useIncubation();

  const completedTasks = tasks.filter((t) => t.completed).length;
  const activeBatches = batches.filter((b) => b.status === "active").length;
  const pendingTasks = tasks.length - completedTasks;

  const hour = new Date().getHours();
  const greetWord =
    hour < 12 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar";
  const greetLine = `${greetWord} üretici, kümesime hoş geldin`;

  const GRID: GridItemType[] = [
    {
      id: "birds",
      label: "KUŞLARIM",
      icon: "bird",
      iconFamily: "mci",
      color: "#2563EB",
      bg: "#DBEAFE",
      badge: birds.length > 0 ? birds.length : undefined,
      action: () => router.push("/(tabs)/birds"),
    },
    {
      id: "checklist",
      label: "HAFTALİK\nRUTİN",
      icon: "checkbox-outline",
      iconFamily: "ion",
      color: "#059669",
      bg: "#D1FAE5",
      badge: pendingTasks > 0 ? pendingTasks : undefined,
      action: () => router.push("/(tabs)/checklist"),
    },
    {
      id: "incubation",
      label: "KULUÇKA",
      icon: "egg-outline",
      iconFamily: "mci",
      color: "#D97706",
      bg: "#FEF3C7",
      badge: activeBatches > 0 ? activeBatches : undefined,
      action: () => router.push("/(tabs)/incubation"),
    },
    {
      id: "lineage",
      label: "SOY AĞACI",
      icon: "family-tree",
      iconFamily: "mci",
      color: "#7C3AED",
      bg: "#EDE9FE",
      action: () => router.push("/(tabs)/lineage"),
    },
    {
      id: "quickadd",
      label: "HIZLI\nEKLE",
      icon: "add-circle",
      iconFamily: "ion",
      color: "#2D7A4F",
      bg: "#D1FAE5",
      action: () => router.push("/(tabs)/hizli-ekle" as any),
    },
    {
      id: "settings",
      label: "AYARLAR",
      icon: "settings-outline",
      iconFamily: "ion",
      color: "#6B7280",
      bg: "#F3F4F6",
      action: () => router.push("/(tabs)/settings"),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <LinearGradient
        colors={["#0D2E1A", "#1B5E37", "#2D7A4F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetLine} numberOfLines={2}>{greetLine}</Text>
          </View>
          <View style={styles.logoWrap}>
            <MaterialCommunityIcons name="feather" size={30} color="rgba(255,255,255,0.9)" />
          </View>
        </View>

        <View style={styles.statsRow}>
          {[
            { val: birds.length, label: "Kuş" },
            { val: activeBatches, label: "Kuluçka" },
            { val: `${completedTasks}/${tasks.length}`, label: "Görev" },
          ].map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={styles.statDiv} />}
              <View style={styles.statItem}>
                <Text style={styles.statVal}>{s.val}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.gridWrap, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.menuLabel}>Ana Menü</Text>
        <View style={styles.grid}>
          {GRID.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.gridCard,
                pressed && { transform: [{ scale: 0.93 }], opacity: 0.88 },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                item.action();
              }}
            >
              <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
                {item.iconFamily === "ion" ? (
                  <Ionicons name={item.icon as any} size={46} color={item.color} />
                ) : (
                  <MaterialCommunityIcons name={item.icon as any} size={46} color={item.color} />
                )}
                {item.badge !== undefined && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.gridLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.version}>Kümesim v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingBottom: 28 },
  heroRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 20, gap: 12,
  },
  greetLine: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    lineHeight: 28,
  },
  logoWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16, paddingVertical: 14,
  },
  statItem: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 20, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular", marginTop: 2 },
  statDiv: { width: 1, alignSelf: "center", height: "75%", backgroundColor: "rgba(255,255,255,0.2)" },
  gridWrap: { paddingHorizontal: 16, paddingTop: 24 },
  menuLabel: {
    fontSize: 12, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase",
    letterSpacing: 0.8, fontFamily: "Inter_700Bold", marginBottom: 14, marginLeft: 4,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  gridCard: {
    width: "30%", minWidth: 100, flex: 0,
    backgroundColor: "#FFFFFF", borderRadius: 22,
    paddingVertical: 22, paddingHorizontal: 8,
    alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  iconBox: {
    width: 76, height: 76, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    marginBottom: 12, position: "relative",
  },
  badge: {
    position: "absolute", top: -5, right: -5,
    backgroundColor: "#ef4444", borderRadius: 10,
    minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
  },
  badgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700", fontFamily: "Inter_700Bold" },
  gridLabel: {
    fontSize: 11, fontWeight: "700", color: "#374151",
    fontFamily: "Inter_700Bold", textAlign: "center", letterSpacing: 0.3, lineHeight: 15,
  },
  version: { textAlign: "center", fontSize: 11, color: "#d1d5db", fontFamily: "Inter_400Regular", marginTop: 24 },
});
