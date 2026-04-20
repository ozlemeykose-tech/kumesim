import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
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

async function pickImageFromSource(source: "camera" | "gallery"): Promise<string | null> {
  try {
    if (source === "camera") {
      if (Platform.OS === "web") {
        Alert.alert("Uyarı", "Kamera web tarayıcısında desteklenmez. Galeri kullanın.");
        return null;
      }
      const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        if (!canAskAgain) {
          Alert.alert("İzin Gerekli", "Kamera iznini Ayarlar'dan açmanız gerekiyor.");
        } else {
          Alert.alert("İzin Gerekli", "Kamera kullanmak için izin vermeniz gerekiyor.");
        }
        return null;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true, aspect: [1, 1], quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) return result.assets[0].uri;
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("İzin Gerekli", "Fotoğraf kitaplığına erişmek için izin gerekiyor.");
        return null;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) return result.assets[0].uri;
    }
  } catch (e) {
    Alert.alert("Hata", "Fotoğraf seçilirken bir hata oluştu.");
  }
  return null;
}

function pickImage(onPick: (uri: string) => void) {
  const options = Platform.OS === "web"
    ? [
        { text: "İptal", style: "cancel" as const },
        { text: "Galeri", onPress: async () => { const u = await pickImageFromSource("gallery"); if (u) onPick(u); } },
      ]
    : [
        { text: "İptal", style: "cancel" as const },
        { text: "Kamera", onPress: async () => { const u = await pickImageFromSource("camera"); if (u) onPick(u); } },
        { text: "Galeri", onPress: async () => { const u = await pickImageFromSource("gallery"); if (u) onPick(u); } },
      ];
  Alert.alert("Fotoğraf Ekle", Platform.OS === "web" ? "Kaynak seçin" : "Kaynak seçin", options);
}

export default function HizliEkleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { canAddBird, addBird } = useBirds();

  const [name, setName] = useState("");
  const [ringNo, setRingNo] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const [gender, setGender] = useState<Gender>("unknown");
  const [imageUri, setImageUri] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName(""); setRingNo(""); setSpecies(""); setBreed("");
    setGender("unknown"); setImageUri(""); setNotes("");
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert("Uyarı", "Kuş adı gereklidir."); return; }
    if (!canAddBird) { Alert.alert("Limit Doldu", `En fazla ${MAX_BIRDS} kuş eklenebilir.`); return; }
    setSaving(true);
    const result = await addBird({ name: name.trim(), ringNo, breed, species, gender, imageUri, notes });
    setSaving(false);
    if (!result.success) { Alert.alert("Hata", result.reason ?? "Kuş eklenemedi."); return; }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Başarılı", "Kuş başarıyla kaydedildi! 🐦", [
      { text: "Tamam", onPress: () => { reset(); router.push("/(tabs)/birds"); } },
      { text: "Bir Tane Daha Ekle", onPress: reset },
    ]);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "web" ? 80 : insets.top + 16,
      paddingBottom: 12,
      flexDirection: "row", alignItems: "center", gap: 12,
    },
    title: { fontSize: 24, fontWeight: "700", fontFamily: "Inter_700Bold", color: colors.foreground },
    content: { paddingHorizontal: 20, paddingBottom: 120 },
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
    saveBtn: {
      backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16,
      alignItems: "center", marginTop: 28, marginBottom: 8,
      shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
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

        <Text style={styles.label}>Fotoğraf</Text>
        <Pressable style={styles.photoArea} onPress={() => pickImage(setImageUri)}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photoImage} resizeMode="cover" />
          ) : (
            <>
              <Ionicons name="camera-outline" size={36} color={colors.mutedForeground} />
              <Text style={styles.photoLabel}>Kamera veya Galeri</Text>
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
    </View>
  );
}
