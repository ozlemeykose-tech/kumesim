import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";

const BIRD_DECO = [
  { size: 52, top: 48,  left:  20, opacity: 0.22, rotate: "-15deg" },
  { size: 34, top: 100, right: 30, opacity: 0.18, rotate:  "10deg" },
  { size: 68, top: 160, right: -10, opacity: 0.12, rotate: "-8deg" },
  { size: 44, top: 220, left:  60, opacity: 0.15, rotate:  "20deg" },
  { size: 28, top:  30, right: 100, opacity: 0.25, rotate:  "5deg" },
  { size: 38, top: 280, right: 50, opacity: 0.14, rotate: "-12deg" },
];

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = async () => {
    setError("");
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (Platform.OS !== "web") {
      // Native Expo Go: signInWithPopup not supported — handled in APK build
      Alert.alert(
        "Bilgi",
        "Google ile giriş, uygulama mağazasından indirilen APK sürümünde kullanılabilir."
      );
      return;
    }

    setLoading(true);
    const result = await loginWithGoogle();
    setLoading(false);
    if (result.success) {
      router.replace("/(tabs)");
    } else {
      setError(result.error ?? "Giriş başarısız.");
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      bounces={false}
    >
      <LinearGradient
        colors={["#0F3D22", "#1B5E37", "#2D7A4F", "#3D9E68"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroSection, { paddingTop: insets.top + 32 }]}
      >
        {BIRD_DECO.map((d, i) => (
          <View
            key={i}
            style={[
              styles.birdDeco,
              {
                top: d.top,
                left: "left" in d ? (d as any).left : undefined,
                right: "right" in d ? (d as any).right : undefined,
                opacity: d.opacity,
                transform: [{ rotate: d.rotate }],
              },
            ]}
          >
            <MaterialCommunityIcons name="bird" size={d.size} color="#FFFFFF" />
          </View>
        ))}

        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="bird" size={72} color="#FFFFFF" />
          </View>
        </View>
        <Text style={styles.appName}>Kümesim</Text>
        <Text style={styles.tagline}>Kuş Bilgi &amp; Soy Takibi</Text>

        <View style={styles.featureRow}>
          {[
            { icon: "check-circle-outline", label: "25 Kuş" },
            { icon: "egg-outline",          label: "Kuluçka" },
            { icon: "share-variant-outline", label: "WhatsApp" },
          ].map((f) => (
            <View key={f.label} style={styles.featureItem}>
              <MaterialCommunityIcons
                name={f.icon as any}
                size={18}
                color="rgba(255,255,255,0.85)"
              />
              <Text style={styles.featureLabel}>{f.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={[styles.formCard, { paddingBottom: insets.bottom + 48 }]}>
        <Text style={styles.formTitle}>KÜMESİME HOŞ GELDİN</Text>
        <Text style={styles.formSub}>
          Google hesabınla giriş yap. Dijital kümesin artık cebinde!
        </Text>

        {!!error && (
          <View style={styles.errorBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Google Sign-In Button */}
        <Pressable
          style={({ pressed }) => [styles.googleBtn, pressed && styles.googleBtnPressed]}
          onPress={handleGoogleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#374151" size="small" />
          ) : (
            <>
              {/* Google "G" logo */}
              <View style={styles.googleIconWrap}>
                <GoogleG />
              </View>
              <Text style={styles.googleBtnText}>Google ile Giriş Yap</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.footerNote}>
          Giriş yaparak Kullanım Koşulları ve Gizlilik Politikasını kabul etmiş olursunuz.
        </Text>
      </View>
    </ScrollView>
  );
}

// Official Google "G" logo as pure React Native (no SVG library needed)
function GoogleG() {
  return (
    <View style={googleG.container}>
      <Text style={googleG.text}>G</Text>
    </View>
  );
}

const googleG = StyleSheet.create({
  container: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
  },
  text: {
    fontSize: 15,
    fontWeight: "700",
    color: "#4285F4",
    lineHeight: 22,
  },
});

const styles = StyleSheet.create({
  heroSection: {
    paddingHorizontal: 28,
    paddingBottom: 48,
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  birdDeco: { position: "absolute" },
  logoWrap:  { marginBottom: 18 },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
  },
  appName: {
    fontSize: 40,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_400Regular",
    marginBottom: 28,
    letterSpacing: 0.3,
  },
  featureRow: { flexDirection: "row", gap: 20 },
  featureItem: { alignItems: "center", gap: 4 },
  featureLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_500Medium",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 40,
    marginTop: -2,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  formSub: {
    fontSize: 14,
    color: "#6b7280",
    fontFamily: "Inter_400Regular",
    marginBottom: 36,
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fef2f2",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: {
    fontSize: 13,
    color: "#ef4444",
    flex: 1,
    fontFamily: "Inter_400Regular",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
    minHeight: 54,
  },
  googleBtnPressed: {
    backgroundColor: "#f9fafb",
    borderColor: "#d1d5db",
  },
  googleIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4285F4",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  googleBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
  footerNote: {
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 24,
    lineHeight: 16,
    fontFamily: "Inter_400Regular",
  },
});
