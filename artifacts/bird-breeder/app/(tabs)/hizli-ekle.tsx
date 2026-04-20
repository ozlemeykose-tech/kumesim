import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MAX_BIRDS, useBirds } from "@/context/BirdsContext";
import { useColors } from "@/hooks/useColors";

const SPECIES_OPTIONS = [
  "Muhabbet Kuşu", "Sultan Papağanı", "Kanarya", "Güvercin", "Hint Bülbülü", "Fink", "Diğer",
];

type Gender = "male" | "female" | "unknown";

const GENDER_COLOR: Record<Gender, string> = {
  male: "#3b82f6", female: "#ec4899", unknown: "#8b5cf6",
};
const GENDER_LABEL: Record<Gender, string> = {
  male: "Erkek", female: "Dişi", unknown: "Bilinmiyor",
};

async function pickFromGallery(): Promise<string | null> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin Gerekli", "Fotoğraf kitaplığına erişmek için izin gerekiyor.");
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) return result.assets[0].uri;
  } catch (_) {
    Alert.alert("Hata", "Galeri açılırken bir hata oluştu.");
  }
  return null;
}

// "Fotoğraf Ekle" → opens the camera IMMEDIATELY (no source-picker dialog).
// Falls back to gallery if camera unavailable / permission denied / web.
async function openCameraDirectly(): Promise<string | null> {
  if (Platform.OS === "web") {
    return pickFromGallery();
  }
  try {
    let perm = await ImagePicker.getCameraPermissionsAsync();
    if (perm.status !== "granted" && perm.canAskAgain) {
      perm = await ImagePicker.requestCameraPermissionsAsync();
    }
    if (perm.status !== "granted") {
      return new Promise((resolve) => {
        const buttons: any[] = [
          { text: "İptal", style: "cancel", onPress: () => resolve(null) },
          { text: "Galeriyi Aç", onPress: async () => resolve(await pickFromGallery()) },
        ];
        if (!perm.canAskAgain) {
          buttons.push({
            text: "Ayarları Aç",
            onPress: async () => { try { await Linking.openSettings(); } catch {} resolve(null); },
          });
        }
        Alert.alert(
          "Kamera İzni Gerekli",
          perm.canAskAgain
            ? "Kameraya erişim izni verilmedi."
            : "Kamera izni reddedildi. Cihaz Ayarlarından açabilirsiniz.",
          buttons
        );
      });
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) return result.assets[0].uri;
    return null;
  } catch (_) {
    // Camera failed → automatic gallery fallback
    return pickFromGallery();
  }
}

export default function HizliEkleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { birds, canAddBird, addBird } = useBirds();

  const [name, setName] = useState("");
  const [ringNo, setRingNo] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState<Gender>("unknown");
  const [imageUri, setImageUri] = useState("");
  const [notes, setNotes] = useState("");
  const [motherId, setMotherId] = useState("");
  const [fatherId, setFatherId] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const males = birds.filter((b) => b.gender === "male");
  const females = birds.filter((b) => b.gender === "female");

  const reset = () => {
    setName(""); setRingNo(""); setSpecies(""); setBreed("");
    setGender("unknown"); setImageUri(""); setNotes("");
    setMotherId(""); setFatherId("");
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  };

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/birds");
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Uyarı", "Kuş adı gereklidir."); return; }
    if (!canAddBird) { Alert.alert("Limit Doldu", `En fazla ${MAX_BIRDS} kuş eklenebilir.`); return; }
    setSaving(true);
    const result = await addBird({
      name: name.trim(), ringNo, breed, species, gender, imageUri, notes, motherId, fatherId,
    });
    setSaving(false);
    if (!result.success) { Alert.alert("Hata", result.reason ?? "Kuş eklenemedi."); return; }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Toast + clear form + STAY on page for next entry
    showToast("Yeni kuş başarıyla kaydedildi");
    reset();
  };

  const handlePickPhoto = async () => {
    const uri = await openCameraDirectly();
    if (uri) setImageUri(uri);
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
    title: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold", color: colors.foreground, flex: 1 },
    content: { paddingHorizontal: 20, paddingBottom: 140 },
    label: {
      fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground, textTransform: "uppercase",
      letterSpacing: 0.5, marginBottom: 8, marginTop: 16,
    },
    input: {
      backgroundColor: colors.muted, borderRadius: 12, padding: 14,
      fontSize: 15, color: colors.foreground, fontFamily: "Inter_400Regular",
    },
    speciesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { paddingVertical: 7, paddingHorizontal: 13, borderRadius: 20, borderWidth: 1.5 },
    chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    genderRow: { flexDirection: "row", gap: 10 },
    genderBtn: {
      flex: 1, paddingVertical: 11, borderRadius: 12, alignItems: "center",
      borderWidth: 2, flexDirection: "row", justifyContent: "center", gap: 6,
    },
    genderBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    photoArea: {
      height: 140, borderRadius: 14, overflow: "hidden",
      backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center",
      borderWidth: 2, borderColor: colors.border, borderStyle: "dashed",
    },
    photoImage: { width: "100%", height: "100%" },
    photoLabel: { fontSize: 14, fontFamily: "Inter_500Medium", color: colors.mutedForeground, marginTop: 8 },
    parentRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    parentChip: { paddingVertical: 7, paddingHorizontal: 13, borderRadius: 20, borderWidth: 1.5 },
    saveBtn: {
      backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16,
      alignItems: "center", marginTop: 28, marginBottom: 8,
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
    toast: {
      position: "absolute", left: 20, right: 20,
      bottom: Platform.OS === "web" ? 110 : 110,
      backgroundColor: "#1B5E37",
      borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18,
      flexDirection: "row", alignItems: "center", gap: 10,
      shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
    },
    toastText: {
      color: "#FFFFFF", fontFamily: "Inter_600SemiBold", fontSize: 14, flex: 1,
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
        <Text style={styles.title}>Hızlı Ekle</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Kuş Adı *</Text>
        <TextInput
          style={styles.input}
          placeholder="Kuşun adı..."
          placeholderTextColor={colors.mutedForeground}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Tür</Text>
        <View style={styles.speciesRow}>
          {SPECIES_OPTIONS.map((s) => (
            <Pressable
              key={s}
              style={[
                styles.chip,
                { backgroundColor: species === s ? colors.primary + "18" : "transparent", borderColor: species === s ? colors.primary : colors.border },
              ]}
              onPress={() => setSpecies(s === species ? "" : s)}
            >
              <Text style={[styles.chipText, { color: species === s ? colors.primary : colors.mutedForeground }]}>{s}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Cinsiyet</Text>
        <View style={styles.genderRow}>
          {(["male", "female", "unknown"] as Gender[]).map((g) => (
            <Pressable
              key={g}
              style={[
                styles.genderBtn,
                { backgroundColor: gender === g ? GENDER_COLOR[g] + "18" : "transparent", borderColor: gender === g ? GENDER_COLOR[g] : colors.border },
              ]}
              onPress={() => setGender(g)}
            >
              <Ionicons
                name={g === "male" ? "male" : g === "female" ? "female" : "help-circle-outline"}
                size={15}
                color={gender === g ? GENDER_COLOR[g] : colors.mutedForeground}
              />
              <Text style={[styles.genderBtnText, { color: gender === g ? GENDER_COLOR[g] : colors.mutedForeground }]}>
                {GENDER_LABEL[g]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>BİLEZİK NO</Text>
        <TextInput
          style={styles.input}
          placeholder="örn. AU24-12345"
          placeholderTextColor={colors.mutedForeground}
          value={ringNo}
          onChangeText={setRingNo}
        />

        <Text style={styles.label}>Irk</Text>
        <TextInput
          style={styles.input}
          placeholder="örn. Roller Kanarya"
          placeholderTextColor={colors.mutedForeground}
          value={breed}
          onChangeText={setBreed}
        />

        {females.length > 0 && (
          <>
            <Text style={styles.label}>Anne Seç</Text>
            <View style={styles.parentRow}>
              {females.map((f) => (
                <Pressable
                  key={f.id}
                  style={[
                    styles.parentChip,
                    {
                      backgroundColor: motherId === f.id ? "#ec4899" + "18" : "transparent",
                      borderColor: motherId === f.id ? "#ec4899" : colors.border,
                    },
                  ]}
                  onPress={() => setMotherId(motherId === f.id ? "" : f.id)}
                >
                  <Text style={[styles.chipText, { color: motherId === f.id ? "#ec4899" : colors.mutedForeground }]}>
                    {f.name?.trim() ? f.name : `Kuş #${f.id.slice(-6)}`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {males.length > 0 && (
          <>
            <Text style={styles.label}>Baba Seç</Text>
            <View style={styles.parentRow}>
              {males.map((m) => (
                <Pressable
                  key={m.id}
                  style={[
                    styles.parentChip,
                    {
                      backgroundColor: fatherId === m.id ? colors.primary + "18" : "transparent",
                      borderColor: fatherId === m.id ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setFatherId(fatherId === m.id ? "" : m.id)}
                >
                  <Text style={[styles.chipText, { color: fatherId === m.id ? colors.primary : colors.mutedForeground }]}>
                    {m.name?.trim() ? m.name : `Kuş #${m.id.slice(-6)}`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <Text style={styles.label}>Fotoğraf</Text>
        <Pressable style={styles.photoArea} onPress={handlePickPhoto}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photoImage} resizeMode="cover" />
          ) : (
            <>
              <Ionicons name="camera" size={36} color={colors.primary} />
              <Text style={styles.photoLabel}>Fotoğraf Ekle (Kamera)</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.label}>Notlar</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: "top" }]}
          placeholder="Bu kuş hakkında notlar..."
          placeholderTextColor={colors.mutedForeground}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <Pressable
          style={[styles.saveBtn, (!name.trim() || saving) && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={!name.trim() || saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? "Kaydediliyor..." : "Kuş Kaydet"}
          </Text>
        </Pressable>
      </ScrollView>

      {toast && (
        <View style={styles.toast} pointerEvents="none">
          <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}
