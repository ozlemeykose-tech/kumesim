import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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

import { useAuth } from "@/context/AuthContext";

const BIRD_DECO = [
  { icon: "bird", size: 52, top: 48, left: 20, opacity: 0.22, rotate: "-15deg" },
  { icon: "bird", size: 34, top: 100, right: 30, opacity: 0.18, rotate: "10deg" },
  { icon: "bird", size: 68, top: 160, right: -10, opacity: 0.12, rotate: "-8deg" },
  { icon: "bird", size: 44, top: 220, left: 60, opacity: 0.15, rotate: "20deg" },
  { icon: "bird", size: 28, top: 30, right: 100, opacity: 0.25, rotate: "5deg" },
  { icon: "bird", size: 38, top: 280, right: 50, opacity: 0.14, rotate: "-12deg" },
];

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Password reset modal state
  const [resetVisible, setResetVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetPw, setResetPw] = useState("");
  const [resetPw2, setResetPw2] = useState("");
  const [resetError, setResetError] = useState("");

  const isValidEmail = (e: string) => /\S+@\S+\.\S+/.test(e);
  const canSubmit = isValidEmail(email) && password.length >= 4;

  const handleLogin = async () => {
    if (!isValidEmail(email)) { setError("Geçerli bir e-posta girin."); return; }
    if (password.length < 4) { setError("Şifre en az 4 karakter olmalıdır."); return; }
    setError("");
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await login(email.toLowerCase().trim(), password);
      if (!result.success) {
        setError(result.error ?? "Giriş başarısız.");
      } else {
        router.replace("/(tabs)");
      }
    } catch (_) {
      setError("Bir hata oluştu. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setResetEmail(email);
    setResetPw("");
    setResetPw2("");
    setResetError("");
    setResetVisible(true);
  };

  const handleResetSubmit = async () => {
    const norm = resetEmail.toLowerCase().trim();
    if (!isValidEmail(norm)) { setResetError("Geçerli bir e-posta girin."); return; }
    if (resetPw.length < 4) { setResetError("Yeni şifre en az 4 karakter olmalıdır."); return; }
    if (resetPw !== resetPw2) { setResetError("Şifreler eşleşmiyor."); return; }
    const key = `auth_pw_${norm}`;
    const exists = await AsyncStorage.getItem(key);
    if (!exists) { setResetError("Bu e-posta ile kayıtlı hesap bulunamadı."); return; }
    await AsyncStorage.setItem(key, resetPw);
    setResetVisible(false);
    Alert.alert("Başarılı", "Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
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
              { icon: "egg-outline", label: "Kuluçka" },
              { icon: "share-variant-outline", label: "WhatsApp" },
            ].map((f) => (
              <View key={f.label} style={styles.featureItem}>
                <MaterialCommunityIcons name={f.icon as any} size={18} color="rgba(255,255,255,0.85)" />
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={[styles.formCard, { paddingBottom: insets.bottom + 40 }]}>
          <Text style={styles.formTitle}>KÜMESİME HOŞ GELDİN</Text>
          <Text style={styles.formSub}>Kaydet, Takip Et. Dijital kümesin artık cebinde!</Text>

          <Text style={styles.inputLabel}>E-posta</Text>
          <View style={[styles.inputWrap, emailFocused && styles.inputWrapFocused]}>
            <Ionicons
              name="mail-outline"
              size={18}
              color={emailFocused ? "#2D7A4F" : "#9ca3af"}
              style={{ marginRight: 10 }}
            />
            <TextInput
              style={styles.inputField}
              placeholder="ornek@eposta.com"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={(t) => { setEmail(t); setError(""); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              returnKeyType="next"
            />
          </View>

          <Text style={styles.inputLabel}>Şifre</Text>
          <View style={[styles.inputWrap, passFocused && styles.inputWrapFocused]}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={passFocused ? "#2D7A4F" : "#9ca3af"}
              style={{ marginRight: 10 }}
            />
            <TextInput
              style={[styles.inputField, { flex: 1 }]}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={(t) => { setPassword(t); setError(""); }}
              secureTextEntry={!showPassword}
              onFocus={() => setPassFocused(true)}
              onBlur={() => setPassFocused(false)}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={18}
                color="#9ca3af"
              />
            </Pressable>
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <Pressable style={styles.forgotBtn} onPress={handleForgotPassword}>
            <Text style={styles.forgotText}>Şifremi Unuttum</Text>
          </Pressable>

          <Pressable
            style={[styles.loginBtn, !canSubmit && { opacity: 0.5 }]}
            onPress={handleLogin}
            disabled={loading || !canSubmit}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.loginBtnText}>Giriş Yap</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </Pressable>

          <Text style={styles.footerNote}>
            Giriş yaparak Kullanım Koşulları ve Gizlilik Politikasını kabul etmiş olursunuz.
          </Text>
        </View>
      </ScrollView>

      {/* Password reset modal */}
      <Modal visible={resetVisible} transparent animationType="fade" onRequestClose={() => setResetVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Şifremi Sıfırla</Text>
            <Text style={styles.modalSub}>Kayıtlı e-postanı gir ve yeni şifreni belirle.</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="E-posta"
              placeholderTextColor="#9ca3af"
              value={resetEmail}
              onChangeText={(t) => { setResetEmail(t); setResetError(""); }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Yeni Şifre"
              placeholderTextColor="#9ca3af"
              value={resetPw}
              onChangeText={(t) => { setResetPw(t); setResetError(""); }}
              secureTextEntry
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Yeni Şifre (Tekrar)"
              placeholderTextColor="#9ca3af"
              value={resetPw2}
              onChangeText={(t) => { setResetPw2(t); setResetError(""); }}
              secureTextEntry
            />
            {!!resetError && <Text style={styles.resetError}>{resetError}</Text>}

            <View style={styles.modalBtnRow}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setResetVisible(false)}>
                <Text style={styles.modalCancelText}>İptal</Text>
              </Pressable>
              <Pressable style={styles.modalConfirmBtn} onPress={handleResetSubmit}>
                <Text style={styles.modalConfirmText}>Güncelle</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  heroSection: {
    paddingHorizontal: 28,
    paddingBottom: 48,
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
  },
  birdDeco: {
    position: "absolute",
  },
  logoWrap: {
    marginBottom: 18,
  },
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
  featureRow: {
    flexDirection: "row",
    gap: 20,
  },
  featureItem: {
    alignItems: "center",
    gap: 4,
  },
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
    paddingTop: 36,
    marginTop: -2,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  formSub: {
    fontSize: 14,
    color: "#6b7280",
    fontFamily: "Inter_400Regular",
    marginBottom: 28,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
    marginTop: 16,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  inputWrapFocused: {
    borderColor: "#2D7A4F",
    backgroundColor: "#F0FAF4",
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    fontFamily: "Inter_400Regular",
  },
  errorText: {
    fontSize: 13,
    color: "#ef4444",
    marginTop: 10,
    fontFamily: "Inter_400Regular",
  },
  forgotBtn: {
    alignSelf: "flex-end",
    paddingVertical: 10,
    paddingLeft: 10,
    marginTop: 6,
  },
  forgotText: {
    fontSize: 14,
    color: "#2D7A4F",
    fontFamily: "Inter_600SemiBold",
  },
  loginBtn: {
    backgroundColor: "#2D7A4F",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
    shadowColor: "#2D7A4F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  footerNote: {
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 24,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center", padding: 24,
  },
  modalBox: {
    backgroundColor: "#FFFFFF", borderRadius: 20,
    padding: 24, width: "100%", maxWidth: 380,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 6 },
  modalSub: { fontSize: 13, color: "#6b7280", marginBottom: 20 },
  modalInput: {
    backgroundColor: "#F3F4F6", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: "#111827", marginBottom: 12,
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  resetError: { fontSize: 13, color: "#ef4444", marginBottom: 10 },
  modalBtnRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  modalCancelBtn: {
    flex: 1, borderWidth: 1, borderColor: "#D1D5DB",
    borderRadius: 10, paddingVertical: 12, alignItems: "center",
  },
  modalCancelText: { fontSize: 15, color: "#374151", fontWeight: "600" },
  modalConfirmBtn: {
    flex: 1, backgroundColor: "#2D7A4F",
    borderRadius: 10, paddingVertical: 12, alignItems: "center",
  },
  modalConfirmText: { fontSize: 15, color: "#FFFFFF", fontWeight: "700" },
});
