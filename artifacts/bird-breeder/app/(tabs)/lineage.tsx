import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Bird, useBirds } from "@/context/BirdsContext";
import { useColors } from "@/hooks/useColors";

const FATHER_COLOR = "#3b82f6"; // blue
const MOTHER_COLOR = "#ec4899"; // pink
const SELF_COLOR = "#1B5E37";   // green

type SlotKind = "self" | "anne" | "baba" | "child";

function genderColor(g: Bird["gender"]) {
  return g === "male" ? FATHER_COLOR : g === "female" ? MOTHER_COLOR : "#8b5cf6";
}

function displayName(b: Bird | undefined) {
  if (!b) return "—";
  return b.name?.trim() ? b.name : `Kuş #${b.id.slice(-6)}`;
}

function NodeCard({
  bird,
  kind,
  onPress,
  empty,
}: {
  bird?: Bird;
  kind: SlotKind;
  onPress?: () => void;
  empty?: boolean;
}) {
  const colors = useColors();
  const accent =
    kind === "anne" ? MOTHER_COLOR :
    kind === "baba" ? FATHER_COLOR :
    kind === "self" ? SELF_COLOR :
    bird ? genderColor(bird.gender) : colors.border;

  const label =
    kind === "anne" ? "ANNE" :
    kind === "baba" ? "BABA" :
    kind === "self" ? "KENDİSİ" :
    "YAVRU";

  const styles = StyleSheet.create({
    card: {
      backgroundColor: empty ? "transparent" : colors.card,
      borderWidth: empty ? 1.5 : 2,
      borderStyle: empty ? "dashed" : "solid",
      borderColor: accent,
      borderRadius: 14,
      padding: 10,
      alignItems: "center",
      width: 110,
      minHeight: 120,
      justifyContent: "center",
      gap: 4,
    },
    badge: {
      position: "absolute",
      top: -9,
      backgroundColor: accent,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    badgeText: {
      color: "#FFFFFF",
      fontFamily: "Inter_700Bold",
      fontSize: 10,
      letterSpacing: 0.5,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: accent + "1A",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    avatarImg: { width: 48, height: 48 },
    name: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 12,
      color: colors.foreground,
      textAlign: "center",
    },
    meta: {
      fontFamily: "Inter_400Regular",
      fontSize: 10,
      color: colors.mutedForeground,
      textAlign: "center",
    },
    emptyText: {
      fontFamily: "Inter_500Medium",
      fontSize: 11,
      color: colors.mutedForeground,
      textAlign: "center",
    },
  });

  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      disabled={empty || !onPress}
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{label}</Text>
      </View>
      {empty || !bird ? (
        <>
          <Ionicons name="add-circle-outline" size={28} color={colors.mutedForeground} />
          <Text style={styles.emptyText}>Bilinmiyor</Text>
        </>
      ) : (
        <>
          <View style={styles.avatar}>
            {bird.imageUri ? (
              <Image source={{ uri: bird.imageUri }} style={styles.avatarImg} />
            ) : (
              <MaterialCommunityIcons name="bird" size={26} color={accent} />
            )}
          </View>
          <Text style={styles.name} numberOfLines={2}>{displayName(bird)}</Text>
          {bird.species ? <Text style={styles.meta} numberOfLines={1}>{bird.species}</Text> : null}
        </>
      )}
    </Pressable>
  );
}

function FamilyTree({ bird, birds, onPick }: { bird: Bird; birds: Bird[]; onPick: (b: Bird) => void }) {
  const colors = useColors();
  const father = birds.find((b) => b.id === bird.fatherId);
  const mother = birds.find((b) => b.id === bird.motherId);
  const children = birds.filter((b) => b.fatherId === bird.id || b.motherId === bird.id);

  const styles = StyleSheet.create({
    wrapper: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 16,
      paddingTop: 24,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    parentsRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 24,
    },
    // Vertical connector going down from each parent
    parentDown: {
      position: "absolute",
      width: 2,
      backgroundColor: "#9CA3AF",
    },
    // Horizontal line joining the two parent verticals
    parentJoin: {
      height: 2,
      backgroundColor: "#9CA3AF",
      alignSelf: "center",
    },
    // Vertical connector from join down to self card
    parentToSelf: {
      width: 2,
      height: 18,
      backgroundColor: "#9CA3AF",
      alignSelf: "center",
    },
    selfRow: {
      alignItems: "center",
      marginTop: 4,
    },
    // Below self → connector to children
    selfToChildren: {
      width: 2,
      height: 18,
      backgroundColor: "#9CA3AF",
      alignSelf: "center",
    },
    childrenJoin: {
      height: 2,
      backgroundColor: "#9CA3AF",
      alignSelf: "center",
    },
    childrenRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 18,
      marginTop: 0,
    },
    childItemWrap: {
      alignItems: "center",
    },
    childToParent: {
      width: 2,
      height: 14,
      backgroundColor: "#9CA3AF",
    },
    sectionLabel: {
      fontFamily: "Inter_700Bold",
      fontSize: 11,
      letterSpacing: 0.6,
      color: colors.mutedForeground,
      textTransform: "uppercase",
      marginBottom: 10,
      textAlign: "center",
    },
    childrenSection: {
      marginTop: 8,
    },
  });

  return (
    <View style={styles.wrapper}>
      <Text style={styles.sectionLabel}>Soy Ağacı — {displayName(bird)}</Text>

      {/* Parents row: Anne (left) + Baba (right) */}
      <View style={styles.parentsRow}>
        <NodeCard
          bird={mother}
          kind="anne"
          onPress={mother ? () => onPick(mother) : undefined}
          empty={!mother}
        />
        <NodeCard
          bird={father}
          kind="baba"
          onPress={father ? () => onPick(father) : undefined}
          empty={!father}
        />
      </View>

      {/* Connector: parents → self */}
      {(father || mother) && (
        <>
          <View style={[styles.parentJoin, { width: 134, marginTop: 6 }]} />
          <View style={styles.parentToSelf} />
        </>
      )}

      {/* Self */}
      <View style={styles.selfRow}>
        <NodeCard bird={bird} kind="self" />
      </View>

      {/* Connector down + children */}
      {children.length > 0 && (
        <View style={styles.childrenSection}>
          <View style={styles.selfToChildren} />
          <View
            style={[
              styles.childrenJoin,
              { width: Math.min(children.length, 4) * 130 - 16 },
            ]}
          />
          <View style={styles.childrenRow}>
            {children.map((c) => (
              <View key={c.id} style={styles.childItemWrap}>
                <View style={styles.childToParent} />
                <NodeCard bird={c} kind="child" onPress={() => onPick(c)} />
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export default function LineageScreen() {
  const colors = useColors();
  const { birds } = useBirds();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ birdId?: string }>();

  // If a birdId is passed via params, focus on that bird's tree.
  // Otherwise show a tree for every bird that has at least one parent or child.
  const initialFocus = useMemo(() => {
    if (params.birdId) return birds.find((b) => b.id === params.birdId) ?? null;
    return null;
  }, [params.birdId, birds]);

  const [focus, setFocus] = useState<Bird | null>(initialFocus);

  React.useEffect(() => {
    if (initialFocus) setFocus(initialFocus);
  }, [initialFocus]);

  const treesToShow: Bird[] = focus
    ? [focus]
    : birds.filter((b) => {
        const hasParent = !!b.fatherId || !!b.motherId;
        const hasChild = birds.some((o) => o.fatherId === b.id || o.motherId === b.id);
        return hasParent || hasChild;
      });

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/birds");
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 16,
      paddingTop: Platform.OS === "web" ? 24 : insets.top + 12,
      paddingBottom: 12,
      flexDirection: "row", alignItems: "center", gap: 8,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: colors.muted,
      alignItems: "center", justifyContent: "center",
    },
    title: { flex: 1, fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold", color: colors.foreground },
    sub: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular", paddingHorizontal: 20, marginBottom: 8 },
    listContent: { paddingHorizontal: 14, paddingBottom: 130 },
    chipRow: {
      flexDirection: "row", flexWrap: "wrap", gap: 8,
      paddingHorizontal: 20, marginBottom: 12,
    },
    chip: {
      paddingVertical: 6, paddingHorizontal: 12, borderRadius: 18,
      borderWidth: 1.5, flexDirection: "row", alignItems: "center", gap: 5,
    },
    chipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    empty: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32 },
    emptyTitle: {
      fontSize: 18, fontWeight: "600", fontFamily: "Inter_600SemiBold",
      color: colors.foreground, marginTop: 16, marginBottom: 6,
    },
    emptyText: {
      fontSize: 13, color: colors.mutedForeground,
      fontFamily: "Inter_400Regular", textAlign: "center",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Geri"
        >
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.title}>Soy Ağacı</Text>
      </View>

      {birds.length > 0 && (
        <Text style={styles.sub}>
          {focus ? `${displayName(focus)} için soy ağacı` : "Bir kuş seçin veya tüm aileleri görün"}
        </Text>
      )}

      {birds.length > 0 && (
        <View style={styles.chipRow}>
          <Pressable
            style={[
              styles.chip,
              { backgroundColor: !focus ? colors.primary + "18" : "transparent",
                borderColor: !focus ? colors.primary : colors.border },
            ]}
            onPress={() => setFocus(null)}
          >
            <Text style={[styles.chipText, { color: !focus ? colors.primary : colors.mutedForeground }]}>
              Tümü
            </Text>
          </Pressable>
          {birds.map((b) => (
            <Pressable
              key={b.id}
              style={[
                styles.chip,
                { backgroundColor: focus?.id === b.id ? colors.primary + "18" : "transparent",
                  borderColor: focus?.id === b.id ? colors.primary : colors.border },
              ]}
              onPress={() => setFocus(b)}
            >
              <Text style={[styles.chipText, { color: focus?.id === b.id ? colors.primary : colors.mutedForeground }]}>
                {displayName(b)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.listContent}>
        {birds.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="family-tree" size={64} color={colors.border} />
            <Text style={styles.emptyTitle}>Henüz kuş eklenmedi</Text>
            <Text style={styles.emptyText}>
              Önce Kuşlarım'a kuş ekleyin, ardından Anne ve Baba seçerek soy ağacı oluşturulur.
            </Text>
          </View>
        ) : treesToShow.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="family-tree" size={64} color={colors.border} />
            <Text style={styles.emptyTitle}>Soy bağı yok</Text>
            <Text style={styles.emptyText}>
              Kuşlara Anne ve Baba seçimi yaparak soy ağacını oluşturun.
            </Text>
          </View>
        ) : (
          treesToShow.map((b) => (
            <FamilyTree key={b.id} bird={b} birds={birds} onPick={setFocus} />
          ))
        )}
      </ScrollView>
    </View>
  );
}
