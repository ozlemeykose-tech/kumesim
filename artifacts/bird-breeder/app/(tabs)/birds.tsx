import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Bird, useBirds } from "@/context/BirdsContext";
import { useColors } from "@/hooks/useColors";

type Gender = "male" | "female" | "unknown";

const GENDER_ICON: Record<Gender, string> = {
  male: "male",
  female: "female",
  unknown: "help-circle-outline",
};

const GENDER_COLOR: Record<Gender, string> = {
  male: "#3b82f6",
  female: "#ec4899",
  unknown: "#8b5cf6",
};

function BirdCard({
  bird,
  onEdit,
  onShare,
}: {
  bird: Bird;
  onEdit: () => void;
  onShare: () => void;
}) {
  const colors = useColors();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 18,
      marginBottom: 16,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    imageArea: {
      height: 160,
      backgroundColor: colors.secondary,
      alignItems: "center",
      justifyContent: "center",
    },
    birdImage: {
      width: "100%",
      height: "100%",
    },
    placeholderIcon: {
      opacity: 0.5,
    },
    infoSection: {
      padding: 16,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    birdName: {
      fontSize: 18,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    genderBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 20,
      backgroundColor: GENDER_COLOR[bird.gender] + "18",
    },
    genderText: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
      color: GENDER_COLOR[bird.gender],
      textTransform: "capitalize",
    },
    breed: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginBottom: 10,
    },
    ringRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 14,
    },
    ringLabel: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_500Medium",
    },
    ringVal: {
      fontSize: 13,
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
      backgroundColor: colors.secondary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
    },
    actionRow: {
      flexDirection: "row",
      gap: 10,
    },
    actionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      borderRadius: 10,
      gap: 6,
      borderWidth: 1,
    },
    editBtn: {
      borderColor: colors.border,
      backgroundColor: colors.muted,
    },
    shareBtn: {
      borderColor: colors.primary + "40",
      backgroundColor: colors.primary + "12",
    },
    actionText: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
    },
  });

  return (
    <View style={styles.card}>
      <View style={styles.imageArea}>
        {bird.imageUri ? (
          <Image source={{ uri: bird.imageUri }} style={styles.birdImage} resizeMode="cover" />
        ) : (
          <MaterialCommunityIcons
            name="bird"
            size={64}
            color={colors.primary}
            style={styles.placeholderIcon}
          />
        )}
      </View>
      <View style={styles.infoSection}>
        <View style={styles.topRow}>
          <Text style={styles.birdName}>{bird.name}</Text>
          <View style={styles.genderBadge}>
            <Ionicons
              name={GENDER_ICON[bird.gender] as any}
              size={12}
              color={GENDER_COLOR[bird.gender]}
            />
            <Text style={styles.genderText}>{bird.gender}</Text>
          </View>
        </View>
        <Text style={styles.breed}>{bird.breed || "Unknown breed"}</Text>
        <View style={styles.ringRow}>
          <Text style={styles.ringLabel}>Ring No:</Text>
          <Text style={styles.ringVal}>{bird.ringNo || "—"}</Text>
        </View>
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, styles.editBtn, pressed && { opacity: 0.7 }]}
            onPress={onEdit}
          >
            <Ionicons name="pencil" size={15} color={colors.foreground} />
            <Text style={[styles.actionText, { color: colors.foreground }]}>Edit</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, styles.shareBtn, pressed && { opacity: 0.7 }]}
            onPress={onShare}
          >
            <Ionicons name="share-outline" size={15} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Share</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function BirdModal({
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
  const [gender, setGender] = useState<Gender>(bird?.gender ?? "unknown");
  const [fatherId, setFatherId] = useState(bird?.fatherId ?? "");
  const [motherId, setMotherId] = useState(bird?.motherId ?? "");
  const [imageUri, setImageUri] = useState(bird?.imageUri ?? "");
  const [notes, setNotes] = useState(bird?.notes ?? "");

  React.useEffect(() => {
    setName(bird?.name ?? "");
    setRingNo(bird?.ringNo ?? "");
    setBreed(bird?.breed ?? "");
    setGender(bird?.gender ?? "unknown");
    setFatherId(bird?.fatherId ?? "");
    setMotherId(bird?.motherId ?? "");
    setImageUri(bird?.imageUri ?? "");
    setNotes(bird?.notes ?? "");
  }, [bird, visible]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant photo library access to add bird photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const males = birds.filter((b) => b.gender === "male" && b.id !== bird?.id);
  const females = birds.filter((b) => b.gender === "female" && b.id !== bird?.id);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name, ringNo, breed, gender, fatherId, motherId, imageUri, notes });
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
      resizeMode: "cover",
    },
    selectRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    selectChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20,
      borderWidth: 1.5,
    },
    selectChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
    saveBtn: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 24,
      marginBottom: 8,
    },
    saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>{bird ? "Edit Bird" : "Add Bird"}</Text>

            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Bird's name"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Ring No</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. AU24-12345"
              placeholderTextColor={colors.mutedForeground}
              value={ringNo}
              onChangeText={setRingNo}
            />

            <Text style={styles.label}>Breed</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Canary, Finch..."
              placeholderTextColor={colors.mutedForeground}
              value={breed}
              onChangeText={setBreed}
            />

            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderRow}>
              {(["male", "female", "unknown"] as Gender[]).map((g) => (
                <Pressable
                  key={g}
                  style={[
                    styles.genderBtn,
                    {
                      backgroundColor: gender === g ? GENDER_COLOR[g] + "18" : "transparent",
                      borderColor: gender === g ? GENDER_COLOR[g] : colors.border,
                    },
                  ]}
                  onPress={() => setGender(g)}
                >
                  <Ionicons
                    name={GENDER_ICON[g] as any}
                    size={18}
                    color={gender === g ? GENDER_COLOR[g] : colors.mutedForeground}
                  />
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Photo</Text>
            {imageUri ? (
              <Pressable onPress={pickImage}>
                <Image source={{ uri: imageUri }} style={styles.photoPreview} />
              </Pressable>
            ) : (
              <Pressable style={styles.photoBtn} onPress={pickImage}>
                <Ionicons name="camera-outline" size={20} color={colors.primary} />
                <Text style={styles.photoBtnText}>Add Photo</Text>
              </Pressable>
            )}

            {males.length > 0 && (
              <>
                <Text style={styles.label}>Father</Text>
                <View style={styles.selectRow}>
                  {males.map((m) => (
                    <Pressable
                      key={m.id}
                      style={[
                        styles.selectChip,
                        {
                          backgroundColor: fatherId === m.id ? colors.primary + "18" : "transparent",
                          borderColor: fatherId === m.id ? colors.primary : colors.border,
                        },
                      ]}
                      onPress={() => setFatherId(fatherId === m.id ? "" : m.id)}
                    >
                      <Text
                        style={[
                          styles.selectChipText,
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
                <Text style={styles.label}>Mother</Text>
                <View style={styles.selectRow}>
                  {females.map((f) => (
                    <Pressable
                      key={f.id}
                      style={[
                        styles.selectChip,
                        {
                          backgroundColor: motherId === f.id ? "#ec4899" + "18" : "transparent",
                          borderColor: motherId === f.id ? "#ec4899" : colors.border,
                        },
                      ]}
                      onPress={() => setMotherId(motherId === f.id ? "" : f.id)}
                    >
                      <Text
                        style={[
                          styles.selectChipText,
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

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: "top" }]}
              placeholder="Any notes about this bird..."
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
              <Text style={styles.saveBtnText}>Save Bird</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function BirdsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { birds, addBird, updateBird, deleteBird } = useBirds();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBird, setEditingBird] = useState<Bird | undefined>(undefined);

  const handleSave = async (data: Omit<Bird, "id">) => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (editingBird) {
      await updateBird(editingBird.id, data);
    } else {
      await addBird(data);
    }
    setModalVisible(false);
    setEditingBird(undefined);
  };

  const handleShare = (bird: Bird) => {
    const msg = `Bird: ${bird.name}\nBreed: ${bird.breed}\nRing No: ${bird.ringNo}\nGender: ${bird.gender}`;
    Alert.alert("Share Bird Info", msg, [{ text: "OK" }]);
  };

  const handleLongPress = (bird: Bird) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete Bird", `Remove ${bird.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteBird(bird.id);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
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
    count: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    addBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
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
          <Text style={styles.title}>My Birds</Text>
          <Text style={styles.count}>{birds.length} bird{birds.length !== 1 ? "s" : ""}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
          onPress={() => { setEditingBird(undefined); setModalVisible(true); }}
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
              onEdit={() => { setEditingBird(item); setModalVisible(true); }}
              onShare={() => handleShare(item)}
            />
          </Pressable>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="bird" size={64} color={colors.border} />
            <Text style={styles.emptyTitle}>No birds yet</Text>
            <Text style={styles.emptyText}>Tap the + button to add your first bird to the flock</Text>
          </View>
        }
      />

      <BirdModal
        visible={modalVisible}
        bird={editingBird}
        birds={birds}
        onClose={() => { setModalVisible(false); setEditingBird(undefined); }}
        onSave={handleSave}
      />
    </View>
  );
}
