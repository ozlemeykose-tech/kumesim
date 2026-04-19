import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import { useColors } from "@/hooks/useColors";

export default function TabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ) : null,
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />

      <Tabs.Screen
        name="birds"
        options={{
          title: "Kütüphane",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="bird" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="hizli-ekle"
        options={{
          title: "Hızlı Ekle",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="plus.circle.fill" tintColor={color} size={26} />
            ) : (
              <Ionicons name="add-circle" size={26} color={color} />
            ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Ayarlar",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="gearshape.fill" tintColor={color} size={22} />
            ) : (
              <Ionicons name="settings-outline" size={22} color={color} />
            ),
        }}
      />

      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="person.fill" tintColor={color} size={22} />
            ) : (
              <Ionicons name="person-circle-outline" size={24} color={color} />
            ),
        }}
      />

      <Tabs.Screen name="checklist" options={{ href: null }} />
      <Tabs.Screen name="incubation" options={{ href: null }} />
      <Tabs.Screen name="lineage" options={{ href: null }} />
    </Tabs>
  );
}
