import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
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
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { IncubationBatch, useIncubation } from "@/context/IncubationContext";
import { useColors } from "@/hooks/useColors";

const STATUS_COLORS = {
  active: "#2D7A4F",
  hatched: "#22c55e",
  failed: "#ef4444",
};

const STATUS_ICONS = {
  active: "timer-outline",
  hatched: "checkmark-circle-outline",
  failed: "close-circle-outline",
};

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  const colors = useColors();
  const width = useSharedValue(0);

  React.useEffect(() => {
    width.value = withTiming(progress, { duration: 900 });
  }, [progress]);

  const animStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View
      style={{
        height: 8,
        backgroundColor: colors.border,
        borderRadius: 4,
        overflow: "hidden",
        flex: 1,
      }}
    >
      <Animated.View
        style={[{ height: 8, borderRadius: 4, backgroundColor: color }, animStyle]}
      />
    </View>
  );
}

function BatchCard({ batch }: { batch: IncubationBatch }) {
  const colors = useColors();
  const { updateBatch, deleteBatch, getDaysRemaining, getProgress } = useIncubation();
  const progress = getProgress(batch);
  const daysLeft = getDaysRemaining(batch);
  const statusColor = STATUS_COLORS[batch.status];

  const handleStatusChange = () => {
    Alert.alert("Update Status", "Mark this batch as:", [
      { text: "Active", onPress: () => updateBatch(batch.id, { status: "active" }) },
      { text: "Hatched", onPress: () => updateBatch(batch.id, { status: "hatched" }) },
      { text: "Failed", onPress: () => updateBatch(batch.id, { status: "failed" }) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleDelete = () => {
    Alert.alert("Delete Batch", `Remove incubation batch for ${batch.birdName}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteBatch(batch.id);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  };

  const pct = Math.round(progress * 100);
  const startDate = new Date(batch.startDate).toLocaleDateString();

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
    topStrip: {
      height: 4,
      backgroundColor: statusColor,
    },
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
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
      backgroundColor: statusColor + "18",
    },
    statusText: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
      color: statusColor,
      textTransform: "capitalize",
    },
    breedText: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginBottom: 12,
    },
    statsRow: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 14,
    },
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
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    progressRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },
    pctText: {
      fontSize: 13,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
      color: statusColor,
      minWidth: 36,
      textAlign: "right",
    },
    actionRow: {
      flexDirection: "row",
      gap: 8,
    },
    actionBtn: {
      flex: 1,
      paddingVertical: 9,
      borderRadius: 10,
      alignItems: "center",
      borderWidth: 1,
    },
    startDate: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
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
              <Ionicons name={STATUS_ICONS[batch.status] as any} size={12} color={statusColor} />
              <Text style={styles.statusText}>{batch.status}</Text>
            </View>
          </Pressable>
        </View>
        <Text style={styles.breedText}>{batch.breed}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{batch.eggCount}</Text>
            <Text style={styles.statLabel}>Eggs</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{batch.incubationDays}</Text>
            <Text style={styles.statLabel}>Total Days</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: batch.status === "active" ? colors.primary : statusColor }]}>
              {batch.status === "active" ? daysLeft : "—"}
            </Text>
            <Text style={styles.statLabel}>Days Left</Text>
          </View>
        </View>

        <View style={styles.progressRow}>
          <ProgressBar progress={batch.status === "hatched" ? 1 : batch.status === "failed" ? progress : progress} color={statusColor} />
          <Text style={styles.pctText}>{pct}%</Text>
        </View>

        <Text style={styles.startDate}>Started: {startDate}</Text>

        <View style={[styles.actionRow, { marginTop: 12 }]}>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { borderColor: colors.border, backgroundColor: colors.muted },
              pressed && { opacity: 0.7 },
            ]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={16} color={colors.destructive} />
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
  const [breed, setBreed] = useState("");
  const [eggCount, setEggCount] = useState("1");
  const [incubationDays, setIncubationDays] = useState("18");
  const [notes, setNotes] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const handleSave = () => {
    if (!birdName.trim()) return;
    onSave({
      birdName: birdName.trim(),
      breed: breed.trim() || "Unknown",
      eggCount: parseInt(eggCount) || 1,
      startDate: today,
      incubationDays: parseInt(incubationDays) || 18,
      notes,
      status: "active",
    });
    setBirdName("");
    setBreed("");
    setEggCount("1");
    setIncubationDays("18");
    setNotes("");
  };

  const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modal: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: "85%",
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
      marginBottom: 6,
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
    row: { flexDirection: "row", gap: 12 },
    saveBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 24,
      marginBottom: 8,
    },
    saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>New Incubation Batch</Text>

            <Text style={styles.label}>Bird / Pair Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Yellow Canary Pair"
              placeholderTextColor={colors.mutedForeground}
              value={birdName}
              onChangeText={setBirdName}
              autoFocus
            />

            <Text style={styles.label}>Breed</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Roller Canary"
              placeholderTextColor={colors.mutedForeground}
              value={breed}
              onChangeText={setBreed}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Egg Count</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1"
                  placeholderTextColor={colors.mutedForeground}
                  value={eggCount}
                  onChangeText={setEggCount}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Incubation Days</Text>
                <TextInput
                  style={styles.input}
                  placeholder="18"
                  placeholderTextColor={colors.mutedForeground}
                  value={incubationDays}
                  onChangeText={setIncubationDays}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: "top" }]}
              placeholder="Optional notes..."
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
              <Text style={styles.saveBtnText}>Start Tracking</Text>
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
  const others = batches.filter((b) => b.status !== "active");

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
      fontSize: 13,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 10,
      marginTop: 8,
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
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Incubation</Text>
          <Text style={styles.sub}>{active.length} active batch{active.length !== 1 ? "es" : ""}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
          onPress={() => setShowAdd(true)}
        >
          <Ionicons name="add" size={26} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {batches.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="egg-easter" size={64} color={colors.border} />
            <Text style={styles.emptyTitle}>No batches yet</Text>
            <Text style={styles.emptyText}>Tap + to start tracking an incubation batch</Text>
          </View>
        ) : (
          <>
            {active.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Active</Text>
                {active.map((b) => (
                  <BatchCard key={b.id} batch={b} />
                ))}
              </>
            )}
            {others.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Completed</Text>
                {others.map((b) => (
                  <BatchCard key={b.id} batch={b} />
                ))}
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
