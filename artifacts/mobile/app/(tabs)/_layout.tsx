import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export default function TabLayout() {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
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
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.tabBar }]} />
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
          tabBarShowLabel: false,
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: focused ? colors.primary : colors.surface,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: focused ? 0 : 1,
                borderColor: colors.border,
              }}
            >
              <MaterialCommunityIcons
                name="robot"
                size={24}
                color={focused ? "#fff" : colors.mutedForeground}
              />
            </View>
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
  );
}
