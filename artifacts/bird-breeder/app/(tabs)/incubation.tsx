import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { IncubationBatch, SPECIES_LIST, useIncubation } from "@/context/IncubationContext";
import { useBirds } from "@/context/BirdsContext";
import { useColors } from "@/hooks/useColors";
import { ScreenHeader } from "@/components/ScreenHeader";

const STATUS_COLORS: Record<string, string> = {
  Yumurtada: "#2D7A4F",
  "Cikım Bekleniyor": "#f59e0b",
  "Cıktı": "#22c55e",
  Basarisiz: "#ef4444",
};

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  const colors = useColors();
  const width = useSharedValue(0);

  React.useEffect(() => {
    width.value = withTiming(progress, { duration: 1000 });
  }, [progress]);

  const animStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View style={{ height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: "hidden", flex: 1 }}>
      <Animated.View style={[{ height: 10, borderRadius: 5, backgroundColor: color }, animStyle]} />
    </View>
  );
}

function BatchCard({ batch }: { batch: IncubationBatch }) {
  const colors = useColors();
  const { updateBatch, deleteBatch, getDaysRemaining, getProgress, getTurkishStatus } = useIncubation();
  const { birds, addBird, canAddBird } = useBirds();
  const progress = getProgress(batch);
  const daysLeft = getDaysRemaining(batch);
  const turkishStatus = getTurkishStatus(batch);

  const expectedHatchDate = (() => {
    const start = new Date(batch.startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + batch.incubationDays);
    return end.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
  })();

  const handleAddChickToBirds = async () => {
    if (!canAddBird) {
      Alert.alert("Limit Doldu", "En fazla 25 kuş eklenebilir.");
      return;
    }
    // Auto-link likely parents: first male and first female of same species
    const sameSpecies = birds.filter((b) => b.species === batch.species);
    const father = sameSpecies.find((b) => b.gender === "male");
    const mother = sameSpecies.find((b) => b.gender === "female");

    const result = await addBird({
      name: `${batch.birdName} yavrusu`,
      ringNo: "",
      breed: "",
      species: batch.species,
      gender: "unknown",
      fatherId: father?.id,
      motherId: mother?.id,
      imageUri: undefined,
      notes: `${batch.species} - ${new Date().toLocaleDateString("tr-TR")} tarihinde kuluçkadan çıktı.`,
    });

    if (result.success) {
      const linked = father || mother
        ? `\nEbeveynler: ${father?.name || "—"} / ${mother?.name || "—"}`
        : "\nEbeveynleri 'Kuşlarım' ekranından atayabilirsiniz.";
      Alert.alert("Yavru Eklendi 🐣", `Yeni yavru 'Kuşlarım' listene eklendi!${linked}`);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert("Hata", result.reason || "Yavru eklenemedi.");
    }
  };
  const statusColor =
    batch.status === "hatched"
      ? "#22c55e"
      : batch.status === "failed"
      ? "#ef4444"
      : progress >= 0.8
      ? "#f59e0b"
      : colors.primary;

  const handleStatusChange = () => {
    Alert.alert("Durum Guncelle", "Bu yuva icin durum:", [
      { text: "Aktif", onPress: () => updateBatch(batch.id, { status: "active" }) },
      { text: "Cikti (Hatched)", onPress: () => updateBatch(batch.id, { status: "hatched" }) },
      { text: "Basarisiz", onPress: () => updateBatch(batch.id, { status: "failed" }) },
      { text: "Iptal", style: "cancel" },
    ]);
  };

  const handleDelete = () => {
    Alert.alert("Grubu Sil", `${batch.birdName} grubunu sil?`, [
      { text: "Iptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          await deleteBatch(batch.id);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  };

  const pct = Math.round(progress * 100);
  const startDate = new Date(batch.startDate).toLocaleDateString("tr-TR");

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 18,
      marginBottom: 14,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 6,
      elevation: 2,
    },
    topStrip: { height: 5, backgroundColor: statusColor },
    content: { padding: 16 },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 2,
    },
    birdName: {
      fontSize: 17,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 20,
      backgroundColor: statusColor + "1A",
    },
    statusText: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: statusColor,
    },
    speciesText: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginBottom: 12,
    },
    statsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
    statBox: {
      flex: 1,
      backgroundColor: colors.muted,
      borderRadius: 10,
      padding: 10,
      alignItems: "center",
    },
    statVal: {
      fontSize: 18,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    statLabel: {
      fontSize: 10,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
      textAlign: "center",
    },
    progressRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 10,
    },
    pctText: {
      fontSize: 13,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: statusColor,
      minWidth: 40,
      textAlign: "right",
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    startDate: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    deleteBtn: {
      padding: 6,
    },
  });

  return (
    <View style={styles.card}>
      <View style={styles.topStrip} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.birdName}>{batch.birdName}</Text>
          <Pressable onPress={handleStatusChange}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{turkishStatus}</Text>
            </View>
          </Pressable>
        </View>
        <Text style={styles.speciesText}>{batch.species}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{batch.eggCount}</Text>
            <Text style={styles.statLabel}>Yumurta</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{batch.incubationDays}</Text>
            <Text style={styles.statLabel}>Toplam Gun</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: batch.status === "active" ? statusColor : colors.mutedForeground }]}>
              {batch.status === "active" ? daysLeft : "—"}
            </Text>
            <Text style={styles.statLabel}>Kalan Gun</Text>
          </View>
        </View>

        <View style={styles.progressRow}>
          <ProgressBar progress={progress} color={statusColor} />
          <Text style={styles.pctText}>{pct}%</Text>
        </View>

        <View style={{
          backgroundColor: "#E8F1EC",
          borderRadius: 10,
          padding: 10,
          marginBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}>
          <Ionicons name="calendar" size={16} color="#2D7A4F" />
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: 11,
              color: "#5A7066",
              fontFamily: "Inter_500Medium",
              marginBottom: 1,
            }}>Tahmini Çıkım Tarihi</Text>
            <Text style={{
              fontSize: 14,
              color: "#1B5E37",
              fontFamily: "Inter_700Bold",
              fontWeight: "700",
            }}>{expectedHatchDate}</Text>
          </View>
        </View>

        {batch.status === "hatched" && (
          <Pressable
            style={({ pressed }) => [{
              backgroundColor: "#2D7A4F",
              borderRadius: 12,
              paddingVertical: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              marginBottom: 12,
            }, pressed && { opacity: 0.85 }]}
            onPress={handleAddChickToBirds}
          >
            <MaterialCommunityIcons name="bird" size={18} color="#FFFFFF" />
            <Text style={{
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: "700",
              fontFamily: "Inter_700Bold",
              letterSpacing: 0.4,
            }}>KUŞLARIMA EKLE</Text>
          </Pressable>
        )}

        <View style={styles.footer}>
          <Text style={styles.startDate}>Başlangıç: {startDate}</Text>
          <Pressable style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color={colors.destructive} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function AddBatchModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (batch: Omit<IncubationBatch, "id">) => void;
}) {
  const colors = useColors();
  const [birdName, setBirdName] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState(SPECIES_LIST[0]);
  const [eggCount, setEggCount] = useState("1");
  const [customDays, setCustomDays] = useState("");
  const [notes, setNotes] = useState("");

  const incubationDays = customDays
    ? parseInt(customDays) || selectedSpecies.days
    : selectedSpecies.days;

  const today = new Date().toISOString().split("T")[0];

  const handleSave = () => {
    if (!birdName.trim()) return;
    onSave({
      birdName: birdName.trim(),
      species: selectedSpecies.label,
      eggCount: parseInt(eggCount) || 1,
      startDate: today,
      incubationDays,
      notes,
      status: "active",
    });
    setBirdName("");
    setSelectedSpecies(SPECIES_LIST[0]);
    setEggCount("1");
    setCustomDays("");
    setNotes("");
  };

  const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modal: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: "90%",
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginTop: 12,
      marginBottom: 4,
    },
    content: { padding: 24 },
    title: {
      fontSize: 20,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      marginBottom: 20,
    },
    label: {
      fontSize: 12,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
      marginTop: 14,
    },
    input: {
      backgroundColor: colors.muted,
      borderRadius: 10,
      padding: 13,
      fontSize: 15,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
    },
    speciesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    speciesChip: {
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1.5,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    speciesChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    daysBadge: {
      backgroundColor: colors.secondary,
      borderRadius: 10,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    daysLabel: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: colors.foreground,
    },
    daysValue: {
      fontSize: 18,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.primary,
    },
    row: { flexDirection: "row", gap: 12 },
    saveBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 24,
      marginBottom: 8,
    },
    saveBtnText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
    },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Yeni Kuluçka Takibi</Text>

            <Text style={styles.label}>Kus / Cift Adi *</Text>
            <TextInput
              style={styles.input}
              placeholder="örn. Sari Kanarya Cifti"
              placeholderTextColor={colors.mutedForeground}
              value={birdName}
              onChangeText={setBirdName}
              autoFocus
            />

            <Text style={styles.label}>Tur Sec</Text>
            <View style={styles.speciesGrid}>
              {SPECIES_LIST.map((sp) => (
                <Pressable
                  key={sp.label}
                  style={[
                    styles.speciesChip,
                    {
                      backgroundColor:
                        selectedSpecies.label === sp.label ? colors.primary + "18" : "transparent",
                      borderColor:
                        selectedSpecies.label === sp.label ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => { setSelectedSpecies(sp); setCustomDays(""); }}
                >
                  <Text
                    style={[
                      styles.speciesChipText,
                      {
                        color:
                          selectedSpecies.label === sp.label ? colors.primary : colors.mutedForeground,
                      },
                    ]}
                  >
                    {sp.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Kulucka Suresi</Text>
            <View style={styles.daysBadge}>
              <Text style={styles.daysLabel}>Otomatik ({selectedSpecies.label})</Text>
              <Text style={styles.daysValue}>{incubationDays} gun</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Farkli gun sayisi girin (opsiyonel)"
              placeholderTextColor={colors.mutedForeground}
              value={customDays}
              onChangeText={setCustomDays}
              keyboardType="number-pad"
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Yumurta Sayisi</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  placeholderTextColor={colors.mutedForeground}
                  value={eggCount}
                  onChangeText={setEggCount}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <Text style={styles.label}>Notlar</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: "top" }]}
              placeholder="Opsiyonel notlar..."
              placeholderTextColor={colors.mutedForeground}
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <Pressable
              style={[styles.saveBtn, !birdName.trim() && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={!birdName.trim()}
            >
              <Text style={styles.saveBtnText}>Takibi Baslat</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function IncubationScreen() {
  const colors = useColors();
  const { batches, addBatch } = useIncubation();
  const [showAdd, setShowAdd] = useState(false);

  const active = batches.filter((b) => b.status === "active");
  const completed = batches.filter((b) => b.status !== "active");

  const handleAdd = async (batch: Omit<IncubationBatch, "id">) => {
    await addBatch(batch);
    setShowAdd(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "web" ? 80 : 16,
      paddingBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      fontSize: 26,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    sub: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    addBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === "web" ? 100 : 120,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 10,
      marginTop: 6,
    },
    legendRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      paddingHorizontal: 20,
      marginBottom: 10,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: {
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
    },
    empty: {
      alignItems: "center",
      paddingVertical: 80,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
      marginTop: 16,
      marginBottom: 6,
    },
    emptyText: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      paddingHorizontal: 32,
    },
  });

  return (
    <View style={styles.container}>
      <ScreenHeader active="incubation" />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Kuluçka</Text>
          <Text style={styles.sub}>{active.length} aktif grup</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
          onPress={() => setShowAdd(true)}
        >
          <Ionicons name="add" size={26} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.legendRow}>
        {[
          { label: "Yumurtada", color: colors.primary },
          { label: "Cikım Bekleniyor", color: "#f59e0b" },
          { label: "Cıktı", color: "#22c55e" },
        ].map((l) => (
          <View key={l.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: l.color }]} />
            <Text style={styles.legendText}>{l.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {batches.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="egg-easter" size={64} color={colors.border} />
            <Text style={styles.emptyTitle}>Henuz grup yok</Text>
            <Text style={styles.emptyText}>+ butonu ile kuluçka takibi baslatın</Text>
          </View>
        ) : (
          <>
            {active.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Aktif</Text>
                {active.map((b) => <BatchCard key={b.id} batch={b} />)}
              </>
            )}
            {completed.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Tamamlandi</Text>
                {completed.map((b) => <BatchCard key={b.id} batch={b} />)}
              </>
            )}
          </>
        )}
      </ScrollView>

      <AddBatchModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={handleAdd}
      />
    </View>
  );
}
