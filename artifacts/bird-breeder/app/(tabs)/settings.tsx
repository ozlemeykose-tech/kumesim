import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useBirds } from "@/context/BirdsContext";
import { useChecklist } from "@/context/ChecklistContext";
import { useIncubation } from "@/context/IncubationContext";
import { useColors } from "@/hooks/useColors";

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={[sec.title, { color: colors.mutedForeground }]}>{title}</Text>
      <View style={[sec.group, { backgroundColor: colors.card }]}>{children}</View>
    </View>
  );
}

const sec = StyleSheet.create({
  title: {
    fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold",
    textTransform: "uppercase", letterSpacing: 0.7,
    marginBottom: 8, marginLeft: 4,
  },
  group: {
    borderRadius: 16, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
});

function SettingsRow({
  icon, label, sublabel, onPress, danger, isLast,
}: {
  icon: string; label: string; sublabel?: string;
  onPress: () => void; danger?: boolean; isLast?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      style={({ pressed }) => [
        row.container,
        { borderBottomColor: colors.border, borderBottomWidth: isLast ? 0 : 1 },
        pressed && { opacity: 0.7 },
      ]}
      onPress={onPress}
    >
      <View style={[row.iconWrap, { backgroundColor: danger ? "#fef2f2" : colors.secondary }]}>
        <Ionicons name={icon as any} size={20} color={danger ? "#ef4444" : colors.primary} />
      </View>
      <View style={row.info}>
        <Text style={[row.label, { color: danger ? "#ef4444" : colors.foreground }]}>{label}</Text>
        {!!sublabel && <Text style={[row.sublabel, { color: colors.mutedForeground }]}>{sublabel}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.border} />
    </Pressable>
  );
}

const row = StyleSheet.create({
  container: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 14, paddingHorizontal: 16, gap: 14,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  info: { flex: 1 },
  label: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  sublabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});

const TERMS_TEXT = `KULLANIM KOŞULLARI

Son güncellenme: Nisan 2025

1. Kümesim uygulamasını kullanarak bu koşulları kabul etmiş olursunuz.
2. Uygulama yalnızca kişisel kuş takibi amacıyla kullanılabilir.
3. Tüm veriler cihazınızda yerel olarak saklanır. Sunuculara aktarılmaz.
4. Ücretsiz kullanıcılar en fazla 25 kuş kaydedebilir.
5. Uygulamayı kötüye kullanmak yasaktır.
6. Geliştiriciler uygulama içeriğinden sorumlu tutulamaz.`;

const PRIVACY_TEXT = `GİZLİLİK POLİTİKASI

Son güncellenme: Nisan 2025

1. Hangi veriler toplanır?
   • E-posta adresiniz (yalnızca yerel cihazda saklanır)
   • Kuş bilgileri (fotoğraf, halka numarası, soy ağacı)
   • Kuluçka kayıtları

2. Verileriniz nasıl kullanılır?
   Tüm veriler yalnızca cihazınızda saklanır. Üçüncü taraflarla paylaşılmaz.

3. Veri silme
   Ayarlar > Hesabı Sil seçeneği ile tüm verilerinizi silebilirsiniz.

4. İletişim
   Sorularınız için: kumesim@destek.com`;

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userEmail, logout } = useAuth();
  const { clearAll: clearBirds, birds } = useBirds();
  const { clearAll: clearChecklist } = useChecklist();
  const { clearAll: clearIncubation } = useIncubation();

  const handleLogout = () => {
    Alert.alert("Çıkış Yap", "Hesabınızdan çıkış yapılsın mı?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Çıkış Yap",
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
      "Hesabı Sil",
      "Bu işlem geri alınamaz. Tüm kuş, kuluçka ve kontrol listesi verileri silinecektir.",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Tamamen Sil",
          style: "destructive",
          onPress: () => {
            Alert.alert("Emin misiniz?", "Tüm veriler kalıcı olarak silinecek.", [
              { text: "Hayır", style: "cancel" },
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
            ]);
          },
        },
      ]
    );
  };

  const showText = (title: string, body: string) => {
    Alert.alert(title, body, [{ text: "Kapat" }]);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerRow: {
      flexDirection: "row", alignItems: "center", gap: 12,
      paddingHorizontal: 20, paddingTop: Platform.OS === "web" ? 80 : insets.top + 16, paddingBottom: 16,
    },
    backBtn: {
      width: 38, height: 38, borderRadius: 12,
      backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center",
    },
    pageTitle: { fontSize: 24, fontWeight: "700", fontFamily: "Inter_700Bold", color: colors.foreground, flex: 1 },
    profileCard: {
      backgroundColor: colors.primary, marginHorizontal: 20, borderRadius: 18,
      padding: 20, flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 28,
    },
    avatarCircle: {
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center", justifyContent: "center",
    },
    pName: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", color: "#FFFFFF" },
    pEmail: { fontSize: 13, color: "rgba(255,255,255,0.75)", fontFamily: "Inter_400Regular", marginTop: 2 },
    pBadge: {
      backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 4, marginTop: 6, alignSelf: "flex-start",
    },
    pBadgeText: { fontSize: 12, color: "rgba(255,255,255,0.9)", fontFamily: "Inter_500Medium" },
    version: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 8 },
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={styles.pageTitle}>Ayarlar</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100 }}>
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={26} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pName}>{userEmail?.split("@")[0] ?? "Kullanıcı"}</Text>
            <Text style={styles.pEmail}>{userEmail ?? "—"}</Text>
            <View style={styles.pBadge}>
              <Text style={styles.pBadgeText}>{birds.length}/25 Kuş</Text>
            </View>
          </View>
        </View>

        <SettingsSection title="Hesap">
          <SettingsRow icon="log-out-outline" label="Çıkış Yap" sublabel="Hesabınızdan güvenli çıkış" onPress={handleLogout} />
          <SettingsRow icon="trash-outline" label="Hesabı Sil" sublabel="Tüm veriler kalıcı olarak silinir" onPress={handleDeleteAccount} danger isLast />
        </SettingsSection>

        <SettingsSection title="Yasal">
          <SettingsRow icon="document-text-outline" label="Kullanım Koşulları" onPress={() => showText("Kullanım Koşulları", TERMS_TEXT)} />
          <SettingsRow icon="shield-checkmark-outline" label="Gizlilik Politikası" sublabel="Verileriniz nasıl korunur" onPress={() => showText("Gizlilik Politikası", PRIVACY_TEXT)} isLast />
        </SettingsSection>

        <SettingsSection title="Uygulama">
          <SettingsRow icon="information-circle-outline" label="Hakkında" sublabel="Kümesim v1.0.0" onPress={() => Alert.alert("Kümesim", "Kümesim v1.0.0\nKuş Bilgi & Soy Takibi\n\nTüm veriler cihazınızda saklanır.")} />
          <SettingsRow icon="star-outline" label="Uygulamayı Değerlendirin" sublabel="Google Play'de puan verin" onPress={() => Alert.alert("Değerlendirme", "Yakında...")} isLast />
        </SettingsSection>

        <Text style={styles.version}>Kümesim v1.0.0 · Google Play için hazır</Text>
      </ScrollView>
    </View>
  );
}
