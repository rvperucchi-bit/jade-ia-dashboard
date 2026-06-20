import {
  SpaceGrotesk_300Light,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from "@expo-google-fonts/space-grotesk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider } from "expo-sqlite";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { initializeDatabase } from "@/db/init";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function DatabaseWrapper({ children }: { children: React.ReactNode }) {
  if (Platform.OS === "web") {
    return <>{children}</>;
  }
  return (
    <SQLiteProvider databaseName="jadeia.db" onInit={initializeDatabase}>
      {children}
    </SQLiteProvider>
  );
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="splash" />
      <Stack.Screen name="login" options={{ animation: "fade" }} />
      <Stack.Screen name="cadastro" options={{ headerShown: false, animation: "slide_from_right" }} />
      <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
      <Stack.Screen
        name="conversa/[id]"
        options={{ headerShown: false, presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="scanner"
        options={{ headerShown: false, presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="marketing"
        options={{ headerShown: false, presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="perfil"
        options={{ headerShown: false, presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="plano"
        options={{ headerShown: false, presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="privacidade"
        options={{ headerShown: false, presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="termos"
        options={{ headerShown: false, presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="ajuda"
        options={{ headerShown: false, presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="treinamento"
        options={{ headerShown: false, presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="notificacoes"
        options={{ headerShown: false, presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="roteiro"
        options={{ headerShown: false, presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="briefing"
        options={{ headerShown: false, presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="laudo"
        options={{ headerShown: false, presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="relatorios"
        options={{ headerShown: false, presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="roleplay"
        options={{ headerShown: false, presentation: "card", animation: "slide_from_right" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_300Light,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <DatabaseWrapper>
            <AuthProvider>
              <AppProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <RootLayoutNav />
                </GestureHandlerRootView>
              </AppProvider>
            </AuthProvider>
          </DatabaseWrapper>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
