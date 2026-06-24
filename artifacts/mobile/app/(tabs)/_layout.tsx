import { Redirect, Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";

import { useOnboarding } from "@/context/OnboardingContext";

export default function TabLayout() {
  const { onboardingDone, onboardingLoaded } = useOnboarding();

  if (!onboardingLoaded) return null;
  if (!onboardingDone) return <Redirect href={"/onboarding" as any} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none", height: 0 },
      }}
    >
      <Tabs.Screen name="index"     options={{ href: null }} />
      <Tabs.Screen name="leads"     options={{ href: null }} />
      <Tabs.Screen name="conversas" options={{ href: null }} />
      <Tabs.Screen name="jade"      options={{ href: null }} />
      <Tabs.Screen name="mais"      options={{ href: null }} />
    </Tabs>
  );
}
