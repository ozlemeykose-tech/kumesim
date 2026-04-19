import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuth } from "@/context/AuthContext";
import { MAX_BIRDS, useBirds } from "@/context/BirdsContext";
import { useChecklist } from "@/context/ChecklistContext";
import { useIncubation } from "@/context/IncubationContext";
import { useColors } from "@/hooks/useColors";

function StatBox({ val, label, color }: { val: string | number; label: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[sb.box, { backgroundColor: colors.card }]}>
      <Text style={[sb.val, { color }]}>{val}</Text>
      <Text style={[sb.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const sb = StyleSheet.create({
  box: { flex: 1, borderRadius: 14, padding: 14, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  val: { fontSize: 24, fontWeight: "700", fontFamily: "Inter_700Bold" },
  label: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3, textAlign: "center" },
});

export default function ProfilScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userEmail, logout } = useAuth();
  const { birds, clearAll: clearBirds } = useBirds();
  const { tasks, clearAll: clearChecklist } = useChecklist();
  const { batches, clearAll: clearIncubation } = useIncubation();

  const completedTasks = tasks.filter((t) => t.completed).length;
  const activeBatches = batches.filter((b) => b.status === "active").length;
  const userDisplay = userEmail?.split("@")[0] ?? "Kullanıcı";
  const initials = userDisplay.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Hesabınızdan çıkış yapılsın mı?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Çıkış Yap",
        style: "destructive",
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    heroWrap: { paddingTop: Platform.OS === "web" ? 80 : insets.top + 16, paddingHorizontal: 20, paddingBottom: 28 },
    avatarRow: { alignItems: "center", marginBottom: 16 },
    avatar: {
      width: 88, height: 88, borderRadius: 44,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center", justifyContent: "center",
      borderWidth: 3, borderColor: "rgba(255,255,255,0.4)",
      marginBottom: 12,
    },
    avatarText: { fontSize: 30, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold" },
    userName: { fontSize: 22, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold", textAlign: "center" },
    userEmail: { fontSize: 14, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 4 },
    planBadge: {
      flexDirection: "row", alignItems: "center", gap: 6,
      backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20,
      paddingHorizontal: 14, paddingVertical: 6, marginTop: 10, alignSelf: "center",
    },
    planText: { fontSize: 13, color: "#FFFFFF", fontFamily: "Inter_600SemiBold" },
    statsRow: { flexDirection: "row", gap: 10, marginHorizontal: 20, marginTop: -16, marginBottom: 24 },
    section: { paddingHorizontal: 20, marginBottom: 24 },
    sectionTitle: {
      fontSize: 12, fontWeight: "700", color: colors.mutedForeground,
      textTransform: "uppercase", letterSpacing: 0.7, fontFamily: "Inter_700Bold",
      marginBottom: 10,
    },
    menuCard: {
      backgroundColor: colors.card, borderRadius: 16, overflow: "hidden",
      shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    },
    menuRow: {
      flexDirection: "row", alignItems: "center", padding: 15, gap: 14,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    menuIcon: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center",
    },
    menuLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.foreground },
    menuLabelDanger: { flex: 1, fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#ef4444" },
    logoutBtn: {
      backgroundColor: "#ef4444", borderRadius: 14, paddingVertical: 14,
      alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8,
      marginHorizontal: 20, marginBottom: 16,
    },
    logoutText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0D2E1A", "#1B5E37", "#2D7A4F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroWrap}
      >
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{userDisplay}</Text>
          <Text style={styles.userEmail}>{userEmail}</Text>
          <View style={styles.planBadge}>
            <MaterialCommunityIcons name="feather" size={14} color="#FFFFFF" />
            <Text style={styles.planText}>Ücretsiz Plan — {birds.length}/{MAX_BIRDS} Kuş</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
        <View style={styles.statsRow}>
          <StatBox val={birds.length} label="Kuş" color={colors.primary} />
          <StatBox val={activeBatches} label="Kuluçka" color="#D97706" />
          <StatBox val={`${completedTasks}/${tasks.length}`} label="Görev" color="#059669" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap</Text>
          <View style={styles.menuCard}>
            <Pressable
              style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.7 }]}
              onPress={() => router.push("/(tabs)/settings")}
            >
              <View style={styles.menuIcon}>
                <Ionicons name="settings-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.menuLabel}>Ayarlar</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.border} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.menuRow, pressed && { opacity: 0.7 }, { borderBottomWidth: 0 }]}
              onPress={() => router.push("/(tabs)/birds")}
            >
              <View style={styles.menuIcon}>
                <MaterialCommunityIcons name="bird" size={18} color={colors.primary} />
              </View>
              <Text style={styles.menuLabel}>Kuş Kütüphanem</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.border} />
            </Pressable>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.85 }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
