import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAuth } from "@/context/AuthContext";
import { useBirds } from "@/context/BirdsContext";
import { useChecklist } from "@/context/ChecklistContext";
import { useIncubation } from "@/context/IncubationContext";
import { useColors } from "@/hooks/useColors";
import { router } from "expo-router";

function SettingsRow({
  icon,
  label,
  sublabel,
  onPress,
  danger,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const colors = useColors();
  const styles = StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      gap: 14,
      marginBottom: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: danger ? colors.destructive + "18" : colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    info: { flex: 1 },
    label: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      color: danger ? colors.destructive : colors.foreground,
    },
    sublabel: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      marginTop: 2,
    },
  });

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.75 }]}
      onPress={onPress}
    >
      <View style={styles.iconWrap}>
        <Ionicons
          name={icon as any}
          size={20}
          color={danger ? colors.destructive : colors.primary}
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.label}>{label}</Text>
        {!!sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.border} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userEmail, logout } = useAuth();
  const { clearAll: clearBirds } = useBirds();
  const { clearAll: clearChecklist } = useChecklist();
  const { clearAll: clearIncubation } = useIncubation();

  const handleLogout = () => {
    Alert.alert("Cikis Yap", "Hesabinizdan cikis yapilsin mi?", [
      { text: "Iptal", style: "cancel" },
      {
        text: "Cikis Yap",
        style: "destructive",
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Hesabi Sil",
      "Bu islem geri alinamaz. Tüm kus verileri, kuluçka kayitlari ve kontrol listesi silinecektir.",
      [
        { text: "Iptal", style: "cancel" },
        {
          text: "Tamamen Sil",
          style: "destructive",
          onPress: async () => {
            Alert.alert(
              "Emin misiniz?",
              "Tüm veriler kalici olarak silinecek.",
              [
                { text: "Hayir", style: "cancel" },
                {
                  text: "Evet, Sil",
                  style: "destructive",
                  onPress: async () => {
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    await clearBirds();
                    await clearChecklist();
                    await clearIncubation();
                    await AsyncStorage.clear();
                    await logout();
                    router.replace("/login");
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "web" ? 80 : 16,
      paddingBottom: 16,
    },
    title: {
      fontSize: 26,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    profileCard: {
      backgroundColor: colors.primary,
      marginHorizontal: 20,
      borderRadius: 18,
      padding: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      marginBottom: 24,
    },
    avatarCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    profileInfo: { flex: 1 },
    profileName: {
      fontSize: 16,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: "#FFFFFF",
    },
    profileEmail: {
      fontSize: 13,
      color: "rgba(255,255,255,0.75)",
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 10,
      marginHorizontal: 20,
    },
    section: {
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    versionText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      marginTop: 8,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ayarlar</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 100 : 120 }}>
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={26} color="#FFFFFF" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Kuscu</Text>
            <Text style={styles.profileEmail}>{userEmail ?? "—"}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Hesap</Text>
        <View style={styles.section}>
          <SettingsRow
            icon="log-out-outline"
            label="Cikis Yap"
            sublabel="Hesabinizdan guvenli cikis yapin"
            onPress={handleLogout}
          />
          <SettingsRow
            icon="trash-outline"
            label="Hesabi Sil"
            sublabel="Tüm veriler kalici olarak silinir"
            onPress={handleDeleteAccount}
            danger
          />
        </View>

        <Text style={styles.sectionTitle}>Uygulama</Text>
        <View style={styles.section}>
          <SettingsRow
            icon="information-circle-outline"
            label="Hakkinda"
            sublabel="AvianNest v1.0.0"
            onPress={() => Alert.alert("AvianNest", "Kus yetistirici uygulamasi v1.0.0")}
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            label="Gizlilik Politikasi"
            sublabel="Verilerinizin nasil kullanildigi"
            onPress={() => Alert.alert("Gizlilik", "Verileriniz yalnizca cihazinizda saklanir.")}
          />
        </View>

        <Text style={styles.versionText}>AvianNest v1.0.0 — Google Play icin hazir</Text>
      </ScrollView>
    </View>
  );
}
