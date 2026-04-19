import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Bird, useBirds } from "@/context/BirdsContext";
import { useColors } from "@/hooks/useColors";

function GenderDot({ gender }: { gender: Bird["gender"] }) {
  const color =
    gender === "male" ? "#3b82f6" : gender === "female" ? "#ec4899" : "#8b5cf6";
  return (
    <View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        marginLeft: 4,
      }}
    />
  );
}

function BirdNode({
  bird,
  depth,
  birds,
  onSelect,
}: {
  bird: Bird;
  depth: number;
  birds: Bird[];
  onSelect: (b: Bird) => void;
}) {
  const colors = useColors();
  const father = birds.find((b) => b.id === bird.fatherId);
  const mother = birds.find((b) => b.id === bird.motherId);
  const [expanded, setExpanded] = useState(depth < 2);
  const hasParents = father || mother;

  const styles = StyleSheet.create({
    wrapper: {
      marginBottom: 8,
    },
    nodeCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderLeftWidth: 3,
      borderLeftColor: depth === 0 ? colors.primary : depth === 1 ? "#4CAF78" : colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    iconBg: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: depth === 0 ? colors.primary + "18" : colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    info: { flex: 1 },
    name: {
      fontSize: 15,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
      flexDirection: "row",
      alignItems: "center",
    },
    nameText: {
      fontSize: 15,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
    detail: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    expandBtn: {
      padding: 4,
    },
    parentSection: {
      marginLeft: 20,
      marginTop: 4,
      borderLeftWidth: 1.5,
      borderLeftColor: colors.border,
      paddingLeft: 12,
    },
    parentLabel: {
      fontSize: 11,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 4,
      marginTop: 6,
    },
  });

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={({ pressed }) => [styles.nodeCard, pressed && { opacity: 0.85 }]}
        onPress={() => onSelect(bird)}
        onLongPress={() => setExpanded((e) => !e)}
      >
        <View style={styles.iconBg}>
          <MaterialCommunityIcons name="bird" size={18} color={colors.primary} />
        </View>
        <View style={styles.info}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.nameText}>{bird.name}</Text>
            <GenderDot gender={bird.gender} />
          </View>
          <Text style={styles.detail}>
            {[bird.breed, bird.ringNo].filter(Boolean).join(" · ") || "No details"}
          </Text>
        </View>
        {hasParents && (
          <Pressable style={styles.expandBtn} onPress={() => setExpanded((e) => !e)}>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.mutedForeground}
            />
          </Pressable>
        )}
      </Pressable>

      {hasParents && expanded && (
        <View style={styles.parentSection}>
          {father && (
            <>
              <Text style={styles.parentLabel}>Father</Text>
              <BirdNode bird={father} depth={depth + 1} birds={birds} onSelect={onSelect} />
            </>
          )}
          {mother && (
            <>
              <Text style={styles.parentLabel}>Mother</Text>
              <BirdNode bird={mother} depth={depth + 1} birds={birds} onSelect={onSelect} />
            </>
          )}
        </View>
      )}
    </View>
  );
}

function BirdDetailSheet({
  bird,
  birds,
  onClose,
}: {
  bird: Bird;
  birds: Bird[];
  onClose: () => void;
}) {
  const colors = useColors();
  const father = birds.find((b) => b.id === bird.fatherId);
  const mother = birds.find((b) => b.id === bird.motherId);
  const children = birds.filter(
    (b) => b.fatherId === bird.id || b.motherId === bird.id
  );

  const styles = StyleSheet.create({
    overlay: {
      position: "absolute",
      inset: 0,
      bottom: 0,
      left: 0,
      right: 0,
      top: 0,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    card: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: Platform.OS === "web" ? 40 : 32,
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: 16,
    },
    name: {
      fontSize: 22,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      marginBottom: 4,
    },
    detail: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
      marginTop: 12,
    },
    relRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    relName: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: colors.foreground,
    },
    relRole: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    emptyRel: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    closeBtn: {
      marginTop: 20,
      paddingVertical: 13,
      backgroundColor: colors.muted,
      borderRadius: 12,
      alignItems: "center",
    },
    closeText: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
  });

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
        <View style={styles.handle} />
        <Text style={styles.name}>{bird.name}</Text>
        <Text style={styles.detail}>
          {[bird.breed, bird.ringNo, bird.gender].filter(Boolean).join(" · ")}
        </Text>

        <Text style={styles.sectionTitle}>Parents</Text>
        {father ? (
          <View style={styles.relRow}>
            <MaterialCommunityIcons name="bird" size={16} color="#3b82f6" />
            <Text style={styles.relName}>{father.name}</Text>
            <Text style={styles.relRole}>(Father)</Text>
          </View>
        ) : null}
        {mother ? (
          <View style={styles.relRow}>
            <MaterialCommunityIcons name="bird" size={16} color="#ec4899" />
            <Text style={styles.relName}>{mother.name}</Text>
            <Text style={styles.relRole}>(Mother)</Text>
          </View>
        ) : null}
        {!father && !mother && (
          <Text style={styles.emptyRel}>No parent info recorded</Text>
        )}

        {children.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Offspring ({children.length})</Text>
            {children.map((c) => (
              <View key={c.id} style={styles.relRow}>
                <MaterialCommunityIcons name="bird" size={16} color={colors.primary} />
                <Text style={styles.relName}>{c.name}</Text>
                <Text style={styles.relRole}>
                  ({c.fatherId === bird.id ? "child" : "child"})
                </Text>
              </View>
            ))}
          </>
        )}

        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </Pressable>
    </Pressable>
  );
}

export default function LineageScreen() {
  const colors = useColors();
  const { birds } = useBirds();
  const [selectedBird, setSelectedBird] = useState<Bird | null>(null);

  const rootBirds = birds.filter(
    (b) => !birds.some((other) => other.fatherId === b.id || other.motherId === b.id) ||
    birds.filter((other) => other.fatherId === b.id || other.motherId === b.id).length === 0
  );

  const displayBirds = rootBirds.length > 0 ? rootBirds : birds;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "web" ? 80 : 16,
      paddingBottom: 10,
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
    hint: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      paddingHorizontal: 20,
      marginBottom: 8,
      fontStyle: "italic",
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === "web" ? 100 : 120,
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
        <Text style={styles.title}>Family Tree</Text>
        <Text style={styles.sub}>Lineage & relationships</Text>
      </View>
      {birds.length > 0 && (
        <Text style={styles.hint}>Tap a bird for details · Long-press to expand/collapse</Text>
      )}

      <ScrollView contentContainerStyle={styles.listContent}>
        {birds.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="family-tree" size={64} color={colors.border} />
            <Text style={styles.emptyTitle}>No birds added yet</Text>
            <Text style={styles.emptyText}>
              Add birds in the My Birds tab, then assign parents to see the family tree
            </Text>
          </View>
        ) : (
          displayBirds.map((bird) => (
            <BirdNode
              key={bird.id}
              bird={bird}
              depth={0}
              birds={birds}
              onSelect={setSelectedBird}
            />
          ))
        )}
      </ScrollView>

      {selectedBird && (
        <BirdDetailSheet
          bird={selectedBird}
          birds={birds}
          onClose={() => setSelectedBird(null)}
        />
      )}
    </View>
  );
}
