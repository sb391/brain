import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Colors } from "@/constants/colors";
import { ensureAnalytics, setUserProps } from "@/lib/analytics";
import { BUILD_LABEL } from "@/constants/buildInfo";
import { hasFirebaseConfig } from "@/lib/firebase";

if (Platform.OS !== "web") {
  void SplashScreen.preventAutoHideAsync();
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        animation: "fade",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="themes" />
      <Stack.Screen name="game" />
      <Stack.Screen name="results" />
      <Stack.Screen name="challenge" />
      <Stack.Screen name="insights" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS !== "web") {
      void SplashScreen.hideAsync();
    }

    console.log("[Build]", BUILD_LABEL, {
      firebaseConfigured: hasFirebaseConfig(),
    });
    void ensureAnalytics();
    void setUserProps();
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <RootLayoutNav />
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
