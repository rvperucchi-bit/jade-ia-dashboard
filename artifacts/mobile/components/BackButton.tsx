import React from "react";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  color?: string;
  topOffset?: number;
}

export function BackButton({ color = "rgba(255,255,255,0.8)", topOffset = 8 }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const top = (Platform.OS === "web" ? 24 : insets.top) + topOffset;

  return (
    <TouchableOpacity
      style={[S.btn, { top }]}
      onPress={() => router.back()}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Feather name="arrow-left" size={20} color={color} />
    </TouchableOpacity>
  );
}

const S = StyleSheet.create({
  btn: {
    position: "absolute",
    left: 16,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
});
