import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="checklist">
        <Icon sf={{ default: "checklist", selected: "checklist" }} />
        <Label>Kontrol</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="birds">
        <Icon sf={{ default: "bird", selected: "bird.fill" }} />
        <Label>Kuslarim</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="incubation">
        <Icon sf={{ default: "drop.circle", selected: "drop.circle.fill" }} />
        <Label>Kulucka</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="lineage">
        <Icon sf={{ default: "list.bullet.indent", selected: "list.bullet.indent" }} />
        <Label>Soy</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
        <Label>Ayarlar</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
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
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="checklist"
        options={{
          title: "Kontrol",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="checklist" tintColor={color} size={22} />
            ) : (
              <Ionicons name="checkbox-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="birds"
        options={{
          title: "Kuslarim",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="bird" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="incubation"
        options={{
          title: "Kulucka",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="drop.circle" tintColor={color} size={22} />
            ) : (
              <MaterialCommunityIcons name="egg-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="lineage"
        options={{
          title: "Soy",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="list.bullet.indent" tintColor={color} size={22} />
            ) : (
              <MaterialCommunityIcons name="family-tree" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ayarlar",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="gearshape" tintColor={color} size={22} />
            ) : (
              <Ionicons name="settings-outline" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen name="index" options={{ href: null }} />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
