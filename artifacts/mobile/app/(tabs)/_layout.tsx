import { Redirect, Tabs } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Platform, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { JADEFab } from "@/components/JADEFab";
import { useOnboarding } from "@/context/OnboardingContext";

export default function TabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  const { onboardingDone, onboardingLoaded } = useOnboarding();

  // Wait until AsyncStorage is checked before deciding
  if (!onboardingLoaded) return null;
  if (!onboardingDone) return <Redirect href={"/onboarding" as any} />;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          headerShown: false,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: isIOS ? "transparent" : colors.tabBar,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            elevation: 0,
            height: isWeb ? 84 : 60,
          },
          tabBarLabelStyle: {
            fontFamily: "SpaceGrotesk_500Medium",
            fontSize: 10,
            marginBottom: isWeb ? 8 : 4,
          },
          tabBarBackground: () => (
            <View style={{ flex: 1, backgroundColor: colors.tabBar + "F0" }} />
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Radar",
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="radar" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="leads"
          options={{
            title: "Leads",
            tabBarIcon: ({ color }) => (
              <Feather name="users" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="conversas"
          options={{
            title: "Conversas",
            tabBarIcon: ({ color }) => (
              <Feather name="message-circle" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="jade"
          options={{
            title: "JADE",
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="robot" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="mais"
          options={{
            title: "Mais",
            tabBarIcon: ({ color }) => (
              <Feather name="more-horizontal" size={22} color={color} />
            ),
          }}
        />
      </Tabs>
      <JADEFab />
    </View>
  );
}
