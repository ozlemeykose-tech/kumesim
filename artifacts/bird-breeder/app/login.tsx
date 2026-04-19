import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValidEmail = (e: string) => /\S+@\S+\.\S+/.test(e);

  const handleLogin = async () => {
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    setError("");
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await login(email.toLowerCase().trim());
      router.replace("/(tabs)/checklist");
    } catch (_) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primary,
    },
    scroll: {
      flexGrow: 1,
    },
    topSection: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: insets.top + 40,
      paddingHorizontal: 32,
    },
    iconWrapper: {
      width: 96,
      height: 96,
      borderRadius: 28,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    appName: {
      fontSize: 32,
      fontWeight: "700" as const,
      color: "#FFFFFF",
      fontFamily: "Inter_700Bold",
      marginBottom: 8,
      textAlign: "center",
    },
    tagline: {
      fontSize: 15,
      color: "rgba(255,255,255,0.75)",
      fontFamily: "Inter_400Regular",
      textAlign: "center",
    },
    card: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: 28,
      paddingTop: 36,
      paddingBottom: insets.bottom + 36,
    },
    cardTitle: {
      fontSize: 22,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      marginBottom: 6,
    },
    cardSub: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginBottom: 28,
    },
    label: {
      fontSize: 13,
      fontWeight: "600" as const,
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.muted,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
      borderWidth: 1.5,
      borderColor: "transparent",
    },
    inputFocused: {
      borderColor: colors.primary,
      backgroundColor: "#fff",
    },
    errorText: {
      fontSize: 13,
      color: colors.destructive,
      marginTop: 8,
      fontFamily: "Inter_400Regular",
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 28,
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700" as const,
      fontFamily: "Inter_700Bold",
    },
  });

  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.topSection}>
            <View style={styles.iconWrapper}>
              <Ionicons name="egg-outline" size={52} color="#FFFFFF" />
            </View>
            <Text style={styles.appName}>AvianNest</Text>
            <Text style={styles.tagline}>Your complete bird breeding companion</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Sign in with your email to continue</Text>

            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={[styles.input, focused && styles.inputFocused]}
              placeholder="you@example.com"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(""); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable
              style={({ pressed }) => [
                styles.button,
                (loading || !email) && styles.buttonDisabled,
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleLogin}
              disabled={loading || !email}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
