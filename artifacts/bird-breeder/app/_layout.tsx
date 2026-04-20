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
  const { isLoggedIn, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const id = setTimeout(() => {
      router.replace(isLoggedIn ? "/(tabs)" : "/login");
    }, 0);
    return () => clearTimeout(id);
  }, [isLoggedIn, loading]);

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

function AuthAwareProviders({ children }: { children: React.ReactNode }) {
  return (
    <BirdsProvider>
      <ChecklistProvider>
        <IncubationProvider>
          {children}
        </IncubationProvider>
      </ChecklistProvider>
    </BirdsProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

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
                <AuthAwareProviders>
                  <RootLayoutNav />
                </AuthAwareProviders>
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
