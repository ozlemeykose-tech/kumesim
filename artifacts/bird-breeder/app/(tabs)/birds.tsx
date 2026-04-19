import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Bird, MAX_BIRDS, useBirds } from "@/context/BirdsContext";
import { useColors } from "@/hooks/useColors";

type Gender = "male" | "female" | "unknown";

const GENDER_COLOR: Record<Gender, string> = {
  male: "#3b82f6",
  female: "#ec4899",
  unknown: "#8b5cf6",
};

const SPECIES_OPTIONS = [
  "Muhabbet Kuşu",
  "Sultan Papağanı",
  "Kanarya",
  "Hint Bülbülü",
  "Güvercin",
  "Diğer",
];

async function pickImage(source: "camera" | "gallery"): Promise<string | null> {
  if (source === "camera") {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin Gerekli", "Kamera erişimi için izin veriniz.");
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) return result.assets[0].uri;
  } else {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin Gerekli", "Fotoğraf kitaplığına erişim için izin veriniz.");
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) return result.assets[0].uri;
  }
  return null;
}

function showImageSourcePicker(onPick: (uri: string) => void) {
  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ["İptal", "Kamera", "Galeri"],
        cancelButtonIndex: 0,
      },
      async (idx) => {
        if (idx === 1) {
          const uri = await pickImage("camera");
          if (uri) onPick(uri);
        } else if (idx === 2) {
          const uri = await pickImage("gallery");
          if (uri) onPick(uri);
        }
      }
    );
  } else {
    Alert.alert("Fotoğraf Ekle", "Kaynak seçiniz", [
      { text: "İptal", style: "cancel" },
      {
        text: "Kamera",
        onPress: async () => {
          const uri = await pickImage("camera");
          if (uri) onPick(uri);
        },
      },
      {
        text: "Galeri",
        onPress: async () => {
          const uri = await pickImage("gallery");
          if (uri) onPick(uri);
        },
      },
    ]);
  }
}

function shareViaWhatsApp(bird: Bird, birds: Bird[]) {
  const father = birds.find((b) => b.id === bird.fatherId);
  const mother = birds.find((b) => b.id === bird.motherId);
  const lineage = [father && `Baba: ${father.name}`, mother && `Anne: ${mother.name}`]
    .filter(Boolean)
    .join(" | ");

  const msg = [
    `*${bird.name}*`,
    `Tür: ${bird.species || "—"}`,
    `Irk: ${bird.breed || "—"}`,
    `Halka No: ${bird.ringNo || "—"}`,
    `Cinsiyet: ${bird.gender === "male" ? "Erkek" : bird.gender === "female" ? "Dişi" : "Bilinmiyor"}`,
    lineage ? `Soy: ${lineage}` : null,
    bird.notes ? `Not: ${bird.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;
  Linking.canOpenURL(url).then((supported) => {
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert("WhatsApp Bulunamadı", "WhatsApp yüklü değil. Mesajı kopyalayabilirsiniz.", [
        { text: "Tamam" },
      ]);
    }
  });
}

function BirdCard({
  bird,
  onPress,
  onShare,
}: {
  bird: Bird;
  onPress: () => void;
  onShare: () => void;
}) {
  const colors = useColors();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      marginBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      gap: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.07,
      shadowRadius: 5,
      elevation: 2,
    },
    imageWrap: {
      width: 68,
      height: 68,
      borderRadius: 14,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    birdImage: { width: 68, height: 68, borderRadius: 14 },
    info: { flex: 1 },
    name: {
      fontSize: 16,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      marginBottom: 3,
    },
    speciesRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 2,
    },
    speciesText: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    genderDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: GENDER_COLOR[bird.gender],
    },
    ringBadge: {
      fontSize: 11,
      color: colors.primary,
      fontFamily: "Inter_500Medium",
      backgroundColor: colors.secondary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      alignSelf: "flex-start",
    },
    shareBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "#25D366" + "18",
      alignItems: "center",
      justifyContent: "center",
    },
  });

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={onPress}
    >
      <View style={styles.imageWrap}>
        {bird.imageUri ? (
          <Image source={{ uri: bird.imageUri }} style={styles.birdImage} />
        ) : (
          <MaterialCommunityIcons name="bird" size={32} color={colors.primary} />
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{bird.name}</Text>
        <View style={styles.speciesRow}>
          <View style={styles.genderDot} />
          <Text style={styles.speciesText}>{bird.species || bird.breed || "Bilinmiyor"}</Text>
        </View>
        {!!bird.ringNo && <Text style={styles.ringBadge}>{bird.ringNo}</Text>}
      </View>
      <Pressable
        style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.7 }]}
        onPress={onShare}
      >
        <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
      </Pressable>
    </Pressable>
  );
}

function BirdDetailModal({
  bird,
  birds,
  visible,
  onClose,
  onEdit,
}: {
  bird: Bird | null;
  birds: Bird[];
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  const colors = useColors();
  if (!bird) return null;

  const father = birds.find((b) => b.id === bird.fatherId);
  const mother = birds.find((b) => b.id === bird.motherId);
  const children = birds.filter(
    (b) => b.fatherId === bird.id || b.motherId === bird.id
  );

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modal: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      maxHeight: "88%",
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginTop: 12,
      marginBottom: 2,
    },
    content: { padding: 24, paddingTop: 16 },
    topRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 16,
      marginBottom: 20,
    },
    photoWrap: {
      width: 88,
      height: 88,
      borderRadius: 18,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    photo: { width: 88, height: 88, borderRadius: 18 },
    nameBlock: { flex: 1 },
    nameText: {
      fontSize: 22,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      marginBottom: 4,
    },
    genderBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      alignSelf: "flex-start",
      backgroundColor: GENDER_COLOR[bird.gender] + "18",
    },
    genderText: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: GENDER_COLOR[bird.gender],
    },
    divider: { height: 1, backgroundColor: colors.border, marginBottom: 16 },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowLabel: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
    },
    rowValue: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
      maxWidth: "60%",
      textAlign: "right",
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginTop: 18,
      marginBottom: 10,
    },
    lineageItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    lineageItemImage: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    lineagePhoto: { width: 36, height: 36, borderRadius: 10 },
    lineageName: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
    lineageRole: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
    },
    emptyLineage: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontStyle: "italic",
    },
    actions: {
      flexDirection: "row",
      gap: 12,
      marginTop: 20,
      marginBottom: 8,
    },
    editBtn: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: "center",
    },
    shareBtn: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: 14,
      backgroundColor: "#25D366",
      alignItems: "center",
    },
    btnText: {
      color: "#FFFFFF",
      fontFamily: "Inter_700Bold",
      fontSize: 15,
      fontWeight: "700" as const,
    },
  });

  const LineageItem = ({
    b,
    role,
  }: {
    b: Bird;
    role: string;
  }) => (
    <View style={styles.lineageItem}>
      <View style={styles.lineageItemImage}>
        {b.imageUri ? (
          <Image source={{ uri: b.imageUri }} style={styles.lineagePhoto} />
        ) : (
          <MaterialCommunityIcons name="bird" size={20} color={colors.primary} />
        )}
      </View>
      <View>
        <Text style={styles.lineageName}>{b.name}</Text>
        <Text style={styles.lineageRole}>{role}</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.topRow}>
              <View style={styles.photoWrap}>
                {bird.imageUri ? (
                  <Image source={{ uri: bird.imageUri }} style={styles.photo} />
                ) : (
                  <MaterialCommunityIcons name="bird" size={44} color={colors.primary} />
                )}
              </View>
              <View style={styles.nameBlock}>
                <Text style={styles.nameText}>{bird.name}</Text>
                <View style={styles.genderBadge}>
                  <Ionicons
                    name={bird.gender === "male" ? "male" : bird.gender === "female" ? "female" : "help-circle-outline"}
                    size={12}
                    color={GENDER_COLOR[bird.gender]}
                  />
                  <Text style={styles.genderText}>
                    {bird.gender === "male" ? "Erkek" : bird.gender === "female" ? "Dişi" : "Bilinmiyor"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Halka No</Text>
              <Text style={styles.rowValue}>{bird.ringNo || "—"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Tür</Text>
              <Text style={styles.rowValue}>{bird.species || "—"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Irk</Text>
              <Text style={styles.rowValue}>{bird.breed || "—"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Baba</Text>
              <Text style={styles.rowValue}>{father?.name || "—"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Anne</Text>
              <Text style={styles.rowValue}>{mother?.name || "—"}</Text>
            </View>

            <Text style={styles.sectionTitle}>Soy Agaci</Text>
            {!father && !mother && children.length === 0 ? (
              <Text style={styles.emptyLineage}>Soy bilgisi girilmemiş</Text>
            ) : (
              <>
                {father && <LineageItem b={father} role="Baba" />}
                {mother && <LineageItem b={mother} role="Anne" />}
                {children.map((c) => (
                  <LineageItem
                    key={c.id}
                    b={c}
                    role={c.fatherId === bird.id && c.motherId === bird.id
                      ? "Yavru"
                      : c.fatherId === bird.id ? "Yavru (Erkek tarafı)" : "Yavru (Dişi tarafı)"}
                  />
                ))}
              </>
            )}

            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.85 }]}
                onPress={onEdit}
              >
                <Text style={styles.btnText}>Duzenle</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.85 }]}
                onPress={() => shareViaWhatsApp(bird, birds)}
              >
                <Text style={styles.btnText}>WhatsApp</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function BirdEditModal({
  visible,
  bird,
  birds,
  onClose,
  onSave,
}: {
  visible: boolean;
  bird?: Bird;
  birds: Bird[];
  onClose: () => void;
  onSave: (data: Omit<Bird, "id">) => void;
}) {
  const colors = useColors();
  const [name, setName] = useState(bird?.name ?? "");
  const [ringNo, setRingNo] = useState(bird?.ringNo ?? "");
  const [breed, setBreed] = useState(bird?.breed ?? "");
  const [species, setSpecies] = useState(bird?.species ?? "");
  const [gender, setGender] = useState<Gender>(bird?.gender ?? "unknown");
  const [fatherId, setFatherId] = useState(bird?.fatherId ?? "");
  const [motherId, setMotherId] = useState(bird?.motherId ?? "");
  const [imageUri, setImageUri] = useState(bird?.imageUri ?? "");
  const [notes, setNotes] = useState(bird?.notes ?? "");

  React.useEffect(() => {
    setName(bird?.name ?? "");
    setRingNo(bird?.ringNo ?? "");
    setBreed(bird?.breed ?? "");
    setSpecies(bird?.species ?? "");
    setGender(bird?.gender ?? "unknown");
    setFatherId(bird?.fatherId ?? "");
    setMotherId(bird?.motherId ?? "");
    setImageUri(bird?.imageUri ?? "");
    setNotes(bird?.notes ?? "");
  }, [bird, visible]);

  const males = birds.filter((b) => b.gender === "male" && b.id !== bird?.id);
  const females = birds.filter((b) => b.gender === "female" && b.id !== bird?.id);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name, ringNo, breed, species, gender, fatherId, motherId, imageUri, notes });
  };

  const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modal: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: "92%",
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginTop: 12,
      marginBottom: 4,
    },
    scrollContent: { padding: 24 },
    title: {
      fontSize: 20,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
      marginBottom: 20,
    },
    label: {
      fontSize: 12,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 6,
      marginTop: 14,
    },
    input: {
      backgroundColor: colors.muted,
      borderRadius: 10,
      padding: 13,
      fontSize: 15,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
    },
    genderRow: { flexDirection: "row", gap: 10 },
    genderBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: "center",
      borderWidth: 2,
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
    },
    genderBtnText: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
    },
    photoBtn: {
      backgroundColor: colors.secondary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },
    photoBtnText: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
      color: colors.primary,
    },
    photoPreview: {
      width: "100%",
      height: 160,
      borderRadius: 10,
    },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1.5,
    },
    chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    saveBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 24,
      marginBottom: 8,
    },
    saveBtnText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
    },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{bird ? "Kusu Duzenle" : "Kus Ekle"}</Text>

            <Text style={styles.label}>Isim *</Text>
            <TextInput
              style={styles.input}
              placeholder="Kusun adi..."
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Tür (Species)</Text>
            <View style={styles.chipRow}>
              {SPECIES_OPTIONS.map((sp) => (
                <Pressable
                  key={sp}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: species === sp ? colors.primary + "18" : "transparent",
                      borderColor: species === sp ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSpecies(sp === species ? "" : sp)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: species === sp ? colors.primary : colors.mutedForeground },
                    ]}
                  >
                    {sp}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Irk (Breed)</Text>
            <TextInput
              style={styles.input}
              placeholder="örn. Roller Kanarya..."
              placeholderTextColor={colors.mutedForeground}
              value={breed}
              onChangeText={setBreed}
            />

            <Text style={styles.label}>Halka No</Text>
            <TextInput
              style={styles.input}
              placeholder="örn. AU24-12345"
              placeholderTextColor={colors.mutedForeground}
              value={ringNo}
              onChangeText={setRingNo}
            />

            <Text style={styles.label}>Cinsiyet</Text>
            <View style={styles.genderRow}>
              {([
                { key: "male" as Gender, label: "Erkek", icon: "male" },
                { key: "female" as Gender, label: "Disi", icon: "female" },
                { key: "unknown" as Gender, label: "?", icon: "help-circle-outline" },
              ] as const).map((g) => (
                <Pressable
                  key={g.key}
                  style={[
                    styles.genderBtn,
                    {
                      backgroundColor: gender === g.key ? GENDER_COLOR[g.key] + "18" : "transparent",
                      borderColor: gender === g.key ? GENDER_COLOR[g.key] : colors.border,
                    },
                  ]}
                  onPress={() => setGender(g.key)}
                >
                  <Ionicons
                    name={g.icon as any}
                    size={16}
                    color={gender === g.key ? GENDER_COLOR[g.key] : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.genderBtnText,
                      { color: gender === g.key ? GENDER_COLOR[g.key] : colors.mutedForeground },
                    ]}
                  >
                    {g.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Fotograf</Text>
            {imageUri ? (
              <Pressable onPress={() => showImageSourcePicker(setImageUri)}>
                <Image source={{ uri: imageUri }} style={styles.photoPreview} resizeMode="cover" />
              </Pressable>
            ) : (
              <Pressable
                style={styles.photoBtn}
                onPress={() => showImageSourcePicker(setImageUri)}
              >
                <Ionicons name="camera-outline" size={20} color={colors.primary} />
                <Text style={styles.photoBtnText}>Fotograf Ekle</Text>
              </Pressable>
            )}

            {males.length > 0 && (
              <>
                <Text style={styles.label}>Baba</Text>
                <View style={styles.chipRow}>
                  {males.map((m) => (
                    <Pressable
                      key={m.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: fatherId === m.id ? colors.primary + "18" : "transparent",
                          borderColor: fatherId === m.id ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setFatherId(fatherId === m.id ? "" : m.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: fatherId === m.id ? colors.primary : colors.mutedForeground },
                        ]}
                      >
                        {m.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {females.length > 0 && (
              <>
                <Text style={styles.label}>Anne</Text>
                <View style={styles.chipRow}>
                  {females.map((f) => (
                    <Pressable
                      key={f.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: motherId === f.id ? "#ec4899" + "18" : "transparent",
                          borderColor: motherId === f.id ? "#ec4899" : colors.border,
                        },
                      ]}
                      onPress={() => setMotherId(motherId === f.id ? "" : f.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: motherId === f.id ? "#ec4899" : colors.mutedForeground },
                        ]}
                      >
                        {f.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.label}>Notlar</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: "top" }]}
              placeholder="Bu kus hakkinda notlar..."
              placeholderTextColor={colors.mutedForeground}
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <Pressable
              style={[styles.saveBtn, !name.trim() && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={!name.trim()}
            >
              <Text style={styles.saveBtnText}>Kaydet</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function BirdsScreen() {
  const colors = useColors();
  const { birds, canAddBird, addBird, updateBird, deleteBird } = useBirds();
  const [detailBird, setDetailBird] = useState<Bird | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingBird, setEditingBird] = useState<Bird | undefined>(undefined);

  const handleSave = async (data: Omit<Bird, "id">) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (editingBird) {
      await updateBird(editingBird.id, data);
      if (detailBird?.id === editingBird.id) {
        setDetailBird({ ...editingBird, ...data });
      }
    } else {
      const result = await addBird(data);
      if (!result.success) {
        Alert.alert("Limit Doldu", result.reason ?? "Kus eklenemedi.");
        return;
      }
    }
    setEditModalVisible(false);
    setEditingBird(undefined);
  };

  const handleLongPress = (bird: Bird) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Kusu Sil", `${bird.name} silinsin mi?`, [
      { text: "Iptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: async () => {
          await deleteBird(bird.id);
          if (detailBird?.id === bird.id) setDetailBird(null);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  };

  const handleAdd = () => {
    if (!canAddBird) {
      Alert.alert("Limit Doldu", `En fazla ${MAX_BIRDS} kus eklenebilir.`);
      return;
    }
    setEditingBird(undefined);
    setEditModalVisible(true);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 20,
      paddingTop: Platform.OS === "web" ? 80 : 16,
      paddingBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      fontSize: 26,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    countRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    count: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    limitBadge: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      color: canAddBird ? colors.primary : colors.destructive,
      backgroundColor: canAddBird ? colors.secondary : colors.destructive + "18",
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 8,
    },
    addBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: canAddBird ? colors.primary : colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    listContent: {
      paddingHorizontal: 20,
      paddingBottom: Platform.OS === "web" ? 100 : 120,
      paddingTop: 8,
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
        <View>
          <Text style={styles.title}>Kuslarim</Text>
          <View style={styles.countRow}>
            <Text style={styles.count}>{birds.length} kus</Text>
            <Text style={styles.limitBadge}>{birds.length}/{MAX_BIRDS}</Text>
          </View>
        </View>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
          onPress={handleAdd}
        >
          <Ionicons name="add" size={26} color="#FFFFFF" />
        </Pressable>
      </View>

      <FlatList
        data={birds}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable onLongPress={() => handleLongPress(item)}>
            <BirdCard
              bird={item}
              onPress={() => setDetailBird(item)}
              onShare={() => shareViaWhatsApp(item, birds)}
            />
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="bird" size={64} color={colors.border} />
            <Text style={styles.emptyTitle}>Henuz kus yok</Text>
            <Text style={styles.emptyText}>+ butonu ile ilk kusunuzu ekleyin</Text>
          </View>
        }
      />

      <BirdDetailModal
        bird={detailBird}
        birds={birds}
        visible={!!detailBird}
        onClose={() => setDetailBird(null)}
        onEdit={() => {
          setEditingBird(detailBird!);
          setDetailBird(null);
          setEditModalVisible(true);
        }}
      />

      <BirdEditModal
        visible={editModalVisible}
        bird={editingBird}
        birds={birds}
        onClose={() => { setEditModalVisible(false); setEditingBird(undefined); }}
        onSave={handleSave}
      />
    </View>
  );
}
