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
        tabBarActiveTintColor: "#2D7A4F",
        tabBarInactiveTintColor: "#7B8A82",
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: "700",
          fontFamily: "Inter_700Bold",
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: isWeb ? 1 : 0.5,
          borderTopColor: colors.border,
          elevation: 0,
          height: isWeb ? 92 : 88,
          paddingBottom: isWeb ? 12 : 28,
          paddingTop: 8,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ),
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />

      <Tabs.Screen
        name="birds"
        options={{
          title: "Kütüphane",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "bird" : "bird"}
              size={30}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="hizli-ekle"
        options={{
          title: "Hızlı Ekle",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="plus.circle.fill" tintColor={color} size={32} />
            ) : (
              <Ionicons name="add-circle" size={32} color={color} />
            ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Ayarlar",
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name="gearshape.fill" tintColor={color} size={28} />
            ) : (
              <Ionicons
                name={focused ? "settings" : "settings-outline"}
                size={28}
                color={color}
              />
            ),
        }}
      />

      <Tabs.Screen name="profil" options={{ href: null }} />
      <Tabs.Screen name="checklist" options={{ href: null }} />
      <Tabs.Screen name="incubation" options={{ href: null }} />
      <Tabs.Screen name="lineage" options={{ href: null }} />
    </Tabs>
  );
}
