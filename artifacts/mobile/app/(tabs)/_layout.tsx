import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "antenna.radiowaves.left.and.right", selected: "antenna.radiowaves.left.and.right" }} />
        <Label>Radar</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="leads">
        <Icon sf={{ default: "person.2", selected: "person.2.fill" }} />
        <Label>Leads</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="conversas">
        <Icon sf={{ default: "bubble.left.and.bubble.right", selected: "bubble.left.and.bubble.right.fill" }} />
        <Label>Conversas</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="jade">
        <Icon sf={{ default: "cpu", selected: "cpu.fill" }} />
        <Label>JADE</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="mais">
        <Icon sf={{ default: "ellipsis", selected: "ellipsis.circle.fill" }} />
        <Label>Mais</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
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

export default function TabLayout() {
  // NativeTabs (unstable) causes eager tab rendering on iOS 26 which can
  // crash certain screens. Use ClassicTabLayout until the API stabilises.
  if (!__DEV__ && isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
