import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export type SectionKey = "checklist" | "birds" | "incubation" | "kutuphane";

const TABS: { key: SectionKey; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; route: string }[] = [
  { key: "checklist", label: "Haftalık Rutin", icon: "calendar-check", route: "/(tabs)/checklist" },
  { key: "birds", label: "Kuşlarım", icon: "bird", route: "/(tabs)/birds" },
  { key: "incubation", label: "Kuluçka", icon: "egg-outline", route: "/(tabs)/incubation" },
];

export function ScreenHeader({ active }: { active?: SectionKey }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View>
      <LinearGradient
        colors={["#1B5E37", "#2D7A4F", "#3F8E62"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.hero,
          { paddingTop: Platform.OS === "web" ? 24 : insets.top + 12 },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="feather" size={26} color="#FFFFFF" />
          </View>
          <Text style={styles.greet}>Merhaba Üretici, Kümesime hoş geldin...</Text>
        </View>
      </LinearGradient>

      <View style={[styles.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {TABS.map((t) => {
          const isActive = t.key === active;
          return (
            <Pressable
              key={t.key}
              style={({ pressed }) => [
                styles.tabItem,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => {
                if (!isActive) router.replace(t.route as any);
              }}
            >
              <View style={[styles.tabInner, isActive && { backgroundColor: "#E8F1EC" }]}>
                <MaterialCommunityIcons
                  name={t.icon}
                  size={18}
                  color={isActive ? "#2D7A4F" : "#7B8A82"}
                />
                <Text style={[styles.tabLabel, { color: isActive ? "#2D7A4F" : "#7B8A82" }]}>
                  {t.label}
                </Text>
              </View>
              {isActive && <View style={styles.activeBar} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  greet: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    lineHeight: 22,
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 0,
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
  },
  tabInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  activeBar: {
    height: 3,
    width: "60%",
    backgroundColor: "#2D7A4F",
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
});
