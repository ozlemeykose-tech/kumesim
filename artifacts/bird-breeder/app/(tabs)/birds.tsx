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

import { router } from "expo-router";

import { Bird, MAX_BIRDS, useBirds } from "@/context/BirdsContext";
import { useColors } from "@/hooks/useColors";
import { ScreenHeader } from "@/components/ScreenHeader";

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

async function pickFromGallery(): Promise<string | null> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin Gerekli", "Fotoğraf kitaplığına erişmek için izin gerekiyor.");
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.6, base64: true,
    });
    if (!result.canceled && result.assets?.[0]) return toPersistentUri(result.assets[0]);
  } catch (_) {
    Alert.alert("Hata", "Galeri açılırken bir hata oluştu.");
  }
  return null;
}

// Convert a picker result into a persistent data URL so the photo survives
// app refreshes / reopens (native cache URIs and web blob URLs would otherwise expire).
function toPersistentUri(asset: ImagePicker.ImagePickerAsset): string | null {
  if (asset.base64) {
    const mime = asset.mimeType || "image/jpeg";
    return `data:${mime};base64,${asset.base64}`;
  }
  return asset.uri ?? null;
}

async function pickImage(source: "camera" | "gallery"): Promise<string | null> {
  if (source === "gallery") return pickFromGallery();

  // Camera path with robust permission handling + gallery fallback
  if (Platform.OS === "web") {
    Alert.alert("Uyarı", "Kamera web tarayıcısında desteklenmez. Galeri açılıyor...");
    return pickFromGallery();
  }
  try {
    // 1) Read current permission state
    let perm = await ImagePicker.getCameraPermissionsAsync();
    // 2) If undetermined, explicitly request it (this triggers the system dialog)
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
          // Permission permanently denied → guide user to system Settings
          buttons.push({
            text: "Ayarları Aç",
            onPress: async () => {
              try { await Linking.openSettings(); } catch {}
              resolve(null);
            },
          });
        }
        Alert.alert(
          "Kamera İzni Gerekli",
          perm.canAskAgain
            ? "Kameraya erişim izni verilmedi. Lütfen izin verin veya galeriyi kullanın."
            : "Kamera izni reddedildi. Cihaz Ayarlarından bu uygulamaya kamera iznini açabilirsiniz.",
          buttons
        );
      });
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.6, base64: true,
    });
    if (!result.canceled && result.assets?.[0]) return toPersistentUri(result.assets[0]);
    return null;
  } catch (err) {
    // Camera failed (no hardware, simulator, etc) → automatic gallery fallback
    return new Promise((resolve) => {
      Alert.alert(
        "Kamera Açılamadı",
        "Kamera başlatılamadı. Onun yerine galeriden seçmek ister misin?",
        [
          { text: "İptal", style: "cancel", onPress: () => resolve(null) },
          { text: "Galeriyi Aç", onPress: async () => resolve(await pickFromGallery()) },
        ]
      );
    });
  }
}

// "Fotoğraf Ekle" → opens the camera IMMEDIATELY. No source-picker dialog.
// Falls back to gallery automatically on web / when permission denied.
async function showImageSourcePicker(onPick: (uri: string) => void) {
  const uri = await pickImage("camera");
  if (uri) onPick(uri);
}

async function shareViaWhatsApp(bird: Bird, birds: Bird[]) {
  const father = birds.find((b) => b.id === bird.fatherId);
  const mother = birds.find((b) => b.id === bird.motherId);
  const lineage = [father && `Baba: ${father.name}`, mother && `Anne: ${mother.name}`]
    .filter(Boolean)
    .join(" | ");

  const displayName = bird.name?.trim() ? bird.name : `Kuş #${bird.id.slice(-6)}`;
  const msg = [
    `*${displayName}*`,
    `Tür: ${bird.species || "—"}`,
    `Irk: ${bird.breed || "—"}`,
    `Bilezik No: ${bird.ringNo || "—"}`,
    `Cinsiyet: ${bird.gender === "male" ? "Erkek" : bird.gender === "female" ? "Dişi" : "Bilinmiyor"}`,
    lineage ? `Soy: ${lineage}` : null,
    bird.notes ? `Not: ${bird.notes}` : null,
    "",
    "Bu kuş kartı Kümesim uygulamasıyla oluşturulmuştur",
  ]
    .filter((line) => line !== null)
    .join("\n");

  // If bird has photo, try to share image with caption via system share sheet
  if (bird.imageUri && Platform.OS !== "web") {
    try {
      const Sharing = await import("expo-sharing");
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(bird.imageUri, {
          mimeType: "image/jpeg",
          dialogTitle: "WhatsApp ile Paylaş",
          UTI: "public.jpeg",
        });
        // After image share, also offer to send caption text via WhatsApp
        const waUrl = `whatsapp://send?text=${encodeURIComponent(msg)}`;
        const supported = await Linking.canOpenURL(waUrl);
        if (supported) await Linking.openURL(waUrl);
        return;
      }
    } catch (_) {
      // fall through to text-only
    }
  }

  const url = `whatsapp://send?text=${encodeURIComponent(msg)}`;
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("WhatsApp Bulunamadı", "WhatsApp yüklü değil. Mesajı kopyalayabilirsiniz.", [
        { text: "Tamam" },
      ]);
    }
  } catch (_) {
    Alert.alert("Paylaşım Hatası", "Paylaşım başlatılamadı.");
  }
}

// Returns true if the two birds share at least one parent (siblings)
function areRelated(birds: Bird[], aId: string, bId: string): boolean {
  if (!aId || !bId || aId === bId) return false;
  const a = birds.find((x) => x.id === aId);
  const b = birds.find((x) => x.id === bId);
  if (!a || !b) return false;
  // Direct parent-child relation
  if (a.fatherId === b.id || a.motherId === b.id) return true;
  if (b.fatherId === a.id || b.motherId === a.id) return true;
  // Sibling: share at least one parent
  if (a.fatherId && (a.fatherId === b.fatherId)) return true;
  if (a.motherId && (a.motherId === b.motherId)) return true;
  return false;
}

function BirdCard({
  bird,
  onPress,
  onShare,
  onEdit,
  onLineage,
  onDelete,
}: {
  bird: Bird;
  onPress: () => void;
  onShare: () => void;
  onEdit: () => void;
  onLineage: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();

  const displayName = bird.name?.trim() ? bird.name : `Kuş #${bird.id.slice(-6)}`;
  const subtitle = bird.species || bird.breed || "Tür belirtilmemiş";

  // A bird is "complete" only if it has the core info filled in.
  // Otherwise, show an exclamation indicator prompting the user to finish it.
  const missingFields: string[] = [];
  if (!bird.imageUri) missingFields.push("Fotoğraf");
  if (!bird.species) missingFields.push("Tür");
  if (bird.gender === "unknown") missingFields.push("Cinsiyet");
  if (!bird.ringNo) missingFields.push("Bilezik No");
  const isIncomplete = missingFields.length > 0;

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 18,
      marginBottom: 16,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.09,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: "#E6EBE7",
    },
    imageWrap: {
      width: "100%",
      height: 170,
      backgroundColor: "#E6EFE9",
      alignItems: "center",
      justifyContent: "center",
    },
    birdImage: { width: "100%", height: 170 },
    ringTag: {
      position: "absolute",
      top: 12, left: 12,
      backgroundColor: "rgba(45,122,79,0.92)",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    deleteBtn: {
      flex: 1,
      backgroundColor: "#DC2626",
      borderRadius: 12,
      paddingVertical: 11,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 5,
    },
    deleteBtnText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.3,
    },
    incompleteBadge: {
      position: "absolute",
      bottom: 10, right: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(245,158,11,0.95)",
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },
    incompleteText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
    },
    incompleteRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: "#FEF3C7",
      borderWidth: 1,
      borderColor: "#FBBF24",
    },
    incompleteHint: {
      flex: 1,
      fontSize: 11,
      color: "#92400E",
      fontFamily: "Inter_500Medium",
    },
    ringTagText: {
      color: "#FFFFFF",
      fontSize: 11,
      fontWeight: "700",
      fontFamily: "Inter_700Bold",
    },
    body: { padding: 14 },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    name: {
      flex: 1,
      fontSize: 18,
      fontWeight: "700",
      fontFamily: "Inter_700Bold",
      color: "#1A2E22",
    },
    genderDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: GENDER_COLOR[bird.gender],
    },
    sub: {
      fontSize: 13,
      color: "#6B7B72",
      fontFamily: "Inter_400Regular",
      marginBottom: 12,
    },
    soyBtn: {
      backgroundColor: "#2D7A4F",
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      marginBottom: 10,
    },
    soyBtnText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "700",
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.5,
    },
    btnRow: { flexDirection: "row", gap: 10 },
    editBtn: {
      flex: 1,
      backgroundColor: "#5B89A8",
      borderRadius: 12,
      paddingVertical: 11,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
    },
    editBtnText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "700",
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.4,
    },
    waBtn: {
      flex: 1,
      backgroundColor: "#25D366",
      borderRadius: 12,
      paddingVertical: 11,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 6,
    },
    waBtnText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "700",
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.3,
    },
  });

  return (
    <View style={styles.card}>
      <Pressable onPress={onPress}>
        <View style={styles.imageWrap}>
          {bird.imageUri ? (
            <Image source={{ uri: bird.imageUri }} style={styles.birdImage} resizeMode="cover" />
          ) : (
            <MaterialCommunityIcons name="bird" size={64} color="#2D7A4F" />
          )}
          {!!bird.ringNo && (
            <View style={styles.ringTag}>
              <Text style={styles.ringTagText}>{bird.ringNo}</Text>
            </View>
          )}
          {isIncomplete && (
            <View style={styles.incompleteBadge}>
              <Ionicons name="alert-circle" size={14} color="#FFFFFF" />
              <Text style={styles.incompleteText}>Eksik</Text>
            </View>
          )}
        </View>
      </Pressable>

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
          <View style={styles.genderDot} />
        </View>
        <Text style={styles.sub} numberOfLines={1}>{subtitle}</Text>

        {isIncomplete && (
          <Pressable style={styles.incompleteRow} onPress={onEdit}>
            <Ionicons name="alert-circle" size={14} color="#92400E" />
            <Text style={styles.incompleteHint} numberOfLines={1}>
              Eksik bilgi: {missingFields.join(", ")}
            </Text>
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [styles.soyBtn, pressed && { opacity: 0.85 }]}
          onPress={onLineage}
        >
          <MaterialCommunityIcons name="family-tree" size={18} color="#FFFFFF" />
          <Text style={styles.soyBtnText}>SOY AĞACI</Text>
        </Pressable>

        <View style={styles.btnRow}>
          <Pressable
            style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.85 }]}
            onPress={onEdit}
          >
            <Ionicons name="create-outline" size={16} color="#FFFFFF" />
            <Text style={styles.editBtnText}>DÜZENLE</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.85 }]}
            onPress={onDelete}
          >
            <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
            <Text style={styles.deleteBtnText}>SİL</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.waBtn, pressed && { opacity: 0.85 }]}
            onPress={onShare}
          >
            <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
            <Text style={styles.waBtnText}>WhatsApp</Text>
          </Pressable>
        </View>
      </View>
    </View>
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
              <Text style={styles.rowLabel}>Bilezik No</Text>
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
  // "Kardeş Seç" — sibling selection used to flag intentional inbreeding pairings
  const [siblingId, setSiblingId] = useState("");

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
    setSiblingId("");
  }, [bird, visible]);

  const males = birds.filter((b) => b.gender === "male" && b.id !== bird?.id);
  const females = birds.filter((b) => b.gender === "female" && b.id !== bird?.id);
  const allOthers = birds.filter((b) => b.id !== bird?.id);

  // Inbreeding flag — true if (mother+father are related) OR a sibling is explicitly selected
  const inbreedingDetected =
    (!!fatherId && !!motherId && areRelated(birds, fatherId, motherId)) ||
    !!siblingId;

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

            <Text style={styles.label}>BİLEZİK NO</Text>
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
                <Text style={styles.label}>Baba Seç</Text>
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
                <Text style={styles.label}>Anne Seç</Text>
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
                        {f.name?.trim() ? f.name : `Kuş #${f.id.slice(-6)}`}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {allOthers.length > 0 && (
              <>
                <Text style={styles.label}>Kardeş Seç (opsiyonel)</Text>
                <View style={styles.chipRow}>
                  {allOthers.map((s) => (
                    <Pressable
                      key={s.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: siblingId === s.id ? "#DC2626" + "18" : "transparent",
                          borderColor: siblingId === s.id ? "#DC2626" : colors.border,
                        },
                      ]}
                      onPress={() => setSiblingId(siblingId === s.id ? "" : s.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: siblingId === s.id ? "#DC2626" : colors.mutedForeground },
                        ]}
                      >
                        {s.name?.trim() ? s.name : `Kuş #${s.id.slice(-6)}`}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {inbreedingDetected && (
              <View style={{
                backgroundColor: "#FEF2F2",
                borderWidth: 1.5,
                borderColor: "#DC2626",
                borderRadius: 12,
                padding: 14,
                marginTop: 14,
                flexDirection: "row",
                gap: 10,
                alignItems: "flex-start",
              }}>
                <Ionicons name="warning" size={22} color="#DC2626" />
                <Text style={{
                  flex: 1,
                  color: "#991B1B",
                  fontFamily: "Inter_700Bold",
                  fontWeight: "700",
                  fontSize: 13,
                  lineHeight: 19,
                }}>
                  Dikkat: Akraba eşleşmesi! Sakat yavru riski ve genetik bozukluk olasılığı yüksektir.
                </Text>
              </View>
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
        Alert.alert("Limit Doldu", result.reason ?? "Kuş eklenemedi.");
        return;
      }
      Alert.alert("Başarılı", "Kuş başarıyla kaydedildi! 🐦");
    }
    setEditModalVisible(false);
    setEditingBird(undefined);
  };

  const handleDeleteBird = (bird: Bird) => {
    Alert.alert(
      "Kuşu Sil",
      `"${bird.name}" silinsin mi?`,
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            await deleteBird(bird.id);
            if (detailBird?.id === bird.id) setDetailBird(null);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  const handleLongPress = (bird: Bird) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleDeleteBird(bird);
  };

  const handleAdd = () => {
    if (!canAddBird) {
      Alert.alert("Limit Doldu", `En fazla ${MAX_BIRDS} kuş eklenebilir.`);
      return;
    }
    setEditingBird(undefined);
    setEditModalVisible(true);
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    subHeader: {
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 6,
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
      <ScreenHeader active="birds" />
      <View style={styles.subHeader}>
        <View>
          <Text style={styles.title}>Kuşlarım</Text>
          <View style={styles.countRow}>
            <Text style={styles.count}>{birds.length} kuş</Text>
            <Text style={styles.limitBadge}>{birds.length}/{MAX_BIRDS}</Text>
          </View>
        </View>
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
              onEdit={() => {
                setEditingBird(item);
                setEditModalVisible(true);
              }}
              onLineage={() => router.push({ pathname: "/(tabs)/lineage" as any, params: { birdId: item.id } })}
              onDelete={() => handleDeleteBird(item)}
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
