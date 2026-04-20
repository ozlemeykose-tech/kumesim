import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { BirdsProvider } from "@/context/BirdsContext";
import { ChecklistProvider } from "@/context/ChecklistContext";
import { IncubationProvider } from "@/context/IncubationContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      router.replace("/(tabs)");
    } else {
      router.replace("/login");
    }
  }, [isLoggedIn]);

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  // Hide splash screen immediately — no font-loading delay.
  // All screens use system fonts (San Francisco on iOS, Roboto on Android,
  // system-ui on web). fontFamily style properties that reference Inter are
  // silently ignored and fall back to the system font.
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  // Web-only: lock the page language to Turkish and disable browser auto-translation.
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    try {
      document.documentElement.setAttribute("lang", "tr");
      document.documentElement.setAttribute("translate", "no");
      const ensureMeta = (name: string, content: string) => {
        let m = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
        if (!m) {
          m = document.createElement("meta");
          m.setAttribute("name", name);
          document.head.appendChild(m);
        }
        m.setAttribute("content", content);
      };
      ensureMeta("google", "notranslate");
      document.documentElement.classList.add("notranslate");
    } catch {}
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AuthProvider>
                <BirdsProvider>
                  <ChecklistProvider>
                    <IncubationProvider>
                      <RootLayoutNav />
                    </IncubationProvider>
                  </ChecklistProvider>
                </BirdsProvider>
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
