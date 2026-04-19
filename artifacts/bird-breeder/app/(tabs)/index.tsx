import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { MAX_BIRDS, useBirds } from "@/context/BirdsContext";
import { useChecklist } from "@/context/ChecklistContext";
import { useIncubation } from "@/context/IncubationContext";

async function pickImage(): Promise<string | null> {
  const pick = async (source: "camera" | "gallery") => {
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") return null;
      const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      return !r.canceled ? r.assets[0].uri : null;
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") return null;
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      return !r.canceled ? r.assets[0].uri : null;
    }
  };

  return new Promise((resolve) => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["İptal", "Kamera", "Galeri"], cancelButtonIndex: 0 },
        async (i) => { if (i === 0) resolve(null); else resolve(await pick(i === 1 ? "camera" : "gallery")); }
      );
    } else {
      Alert.alert("Fotoğraf Ekle", "Kaynak seçin", [
        { text: "İptal", style: "cancel", onPress: () => resolve(null) },
        { text: "Kamera", onPress: async () => resolve(await pick("camera")) },
        { text: "Galeri", onPress: async () => resolve(await pick("gallery")) },
      ]);
    }
  });
}

function QuickAddModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { canAddBird, addBird } = useBirds();
  const [name, setName] = useState("");
  const [ringNo, setRingNo] = useState("");
  const [species, setSpecies] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [saving, setSaving] = useState(false);

  const SPECIES_QUICK = ["Muhabbet Kuşu", "Kanarya", "Güvercin", "Sultan Papağanı"];

  const reset = () => { setName(""); setRingNo(""); setSpecies(""); setImageUri(""); };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (!canAddBird) { Alert.alert("Limit Doldu", `En fazla ${MAX_BIRDS} kuş eklenebilir.`); return; }
    setSaving(true);
    const result = await addBird({ name: name.trim(), ringNo, breed: "", species, gender: "unknown", imageUri, notes: "" });
    setSaving(false);
    if (!result.success) { Alert.alert("Hata", result.reason ?? "Kuş eklenemedi."); return; }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={qa.overlay} onPress={onClose}>
        <Pressable style={qa.card} onPress={(e) => e.stopPropagation()}>
          <View style={qa.handle} />
          <Text style={qa.title}>Hızlı Kuş Ekle</Text>
          <Text style={qa.label}>Kuş Adı *</Text>
          <TextInput style={qa.input} placeholder="İsim..." placeholderTextColor="#9ca3af" value={name} onChangeText={setName} autoFocus />
          <Text style={qa.label}>Halka No</Text>
          <TextInput style={qa.input} placeholder="Opsiyonel..." placeholderTextColor="#9ca3af" value={ringNo} onChangeText={setRingNo} />
          <Text style={qa.label}>Tür</Text>
          <View style={qa.chipRow}>
            {SPECIES_QUICK.map((s) => (
              <Pressable key={s} style={[qa.chip, species === s && qa.chipActive]} onPress={() => setSpecies(s === species ? "" : s)}>
                <Text style={[qa.chipText, species === s && qa.chipTextActive]}>{s}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={qa.photoBtn} onPress={async () => { const u = await pickImage(); if (u) setImageUri(u); }}>
            <Ionicons name="camera-outline" size={18} color="#2D7A4F" />
            <Text style={qa.photoBtnText}>{imageUri ? "Fotoğraf Seçildi ✓" : "Fotoğraf Ekle"}</Text>
          </Pressable>
          <Pressable style={[qa.saveBtn, (!name.trim() || saving) && { opacity: 0.5 }]} onPress={handleSave} disabled={!name.trim() || saving}>
            <Text style={qa.saveBtnText}>Kaydet</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const qa = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  card: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: "#e5e7eb", marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827", fontFamily: "Inter_700Bold", marginBottom: 8 },
  label: { fontSize: 12, fontWeight: "600", color: "#6b7280", fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: "#F3F4F6", borderRadius: 10, padding: 13, fontSize: 15, color: "#111827", fontFamily: "Inter_400Regular" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1.5, borderColor: "#e5e7eb" },
  chipActive: { backgroundColor: "#F0FAF4", borderColor: "#2D7A4F" },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#6b7280" },
  chipTextActive: { color: "#2D7A4F" },
  photoBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F0FAF4", borderRadius: 10, padding: 12, marginTop: 12 },
  photoBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "#2D7A4F" },
  saveBtn: { backgroundColor: "#2D7A4F", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
});

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
  const [quickAdd, setQuickAdd] = useState(false);

  const completedTasks = tasks.filter((t) => t.completed).length;
  const activeBatches = batches.filter((b) => b.status === "active").length;
  const pendingTasks = tasks.length - completedTasks;

  const userDisplay = userEmail?.split("@")[0] ?? "Kullanıcı";
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Günaydın" : hour < 18 ? "İyi Günler" : "İyi Akşamlar";

  const GRID: GridItemType[] = [
    {
      id: "checklist", label: "HAFTALİK\nRUTİN",
      icon: "checkbox-outline", iconFamily: "ion",
      color: "#059669", bg: "#D1FAE5",
      badge: pendingTasks > 0 ? pendingTasks : undefined,
      action: () => router.push("/(tabs)/checklist"),
    },
    {
      id: "birds", label: "KUŞLARIM",
      icon: "bird", iconFamily: "mci",
      color: "#2563EB", bg: "#DBEAFE",
      badge: birds.length > 0 ? birds.length : undefined,
      action: () => router.push("/(tabs)/birds"),
    },
    {
      id: "incubation", label: "KULUÇKA",
      icon: "egg-outline", iconFamily: "mci",
      color: "#D97706", bg: "#FEF3C7",
      badge: activeBatches > 0 ? activeBatches : undefined,
      action: () => router.push("/(tabs)/incubation"),
    },
    {
      id: "profile", label: "PROFİL",
      icon: "person-circle-outline", iconFamily: "ion",
      color: "#7C3AED", bg: "#EDE9FE",
      action: () => router.push("/(tabs)/settings"),
    },
    {
      id: "quickadd", label: "HIZLI\nEKLE",
      icon: "add-circle", iconFamily: "ion",
      color: "#2D7A4F", bg: "#D1FAE5",
      action: () => setQuickAdd(true),
    },
    {
      id: "settings", label: "AYARLAR",
      icon: "settings-outline", iconFamily: "ion",
      color: "#6B7280", bg: "#F3F4F6",
      action: () => router.push("/(tabs)/settings"),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <LinearGradient
        colors={["#0F3D22", "#2D7A4F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.greetText}>{greet},</Text>
            <Text style={styles.userName}>{userDisplay}</Text>
          </View>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="bird" size={34} color="rgba(255,255,255,0.9)" />
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
        contentContainerStyle={[styles.gridWrap, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.menuLabel}>Ana Menü</Text>
        <View style={styles.grid}>
          {GRID.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.gridCard, pressed && { transform: [{ scale: 0.93 }], opacity: 0.88 }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); item.action(); }}
            >
              <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
                {item.iconFamily === "ion"
                  ? <Ionicons name={item.icon as any} size={38} color={item.color} />
                  : <MaterialCommunityIcons name={item.icon as any} size={38} color={item.color} />
                }
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

      <QuickAddModal visible={quickAdd} onClose={() => setQuickAdd(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { paddingHorizontal: 20, paddingBottom: 28 },
  heroRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  greetText: { fontSize: 14, color: "rgba(255,255,255,0.65)", fontFamily: "Inter_400Regular" },
  userName: { fontSize: 24, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold", textTransform: "capitalize" },
  heroIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 16, paddingVertical: 14 },
  statItem: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 20, fontWeight: "700", color: "#FFFFFF", fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular", marginTop: 2 },
  statDiv: { width: 1, alignSelf: "center", height: "75%", backgroundColor: "rgba(255,255,255,0.2)" },
  gridWrap: { paddingHorizontal: 16, paddingTop: 24 },
  menuLabel: { fontSize: 12, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, fontFamily: "Inter_700Bold", marginBottom: 14, marginLeft: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  gridCard: {
    width: "30%", minWidth: 100, flex: 0,
    backgroundColor: "#FFFFFF", borderRadius: 20,
    paddingVertical: 20, paddingHorizontal: 8,
    alignItems: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  iconBox: { width: 70, height: 70, borderRadius: 20, alignItems: "center", justifyContent: "center", marginBottom: 12, position: "relative" },
  badge: { position: "absolute", top: -5, right: -5, backgroundColor: "#ef4444", borderRadius: 10, minWidth: 20, height: 20, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  badgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700", fontFamily: "Inter_700Bold" },
  gridLabel: { fontSize: 11, fontWeight: "700", color: "#374151", fontFamily: "Inter_700Bold", textAlign: "center", letterSpacing: 0.3, lineHeight: 15 },
  version: { textAlign: "center", fontSize: 11, color: "#d1d5db", fontFamily: "Inter_400Regular", marginTop: 24 },
});
