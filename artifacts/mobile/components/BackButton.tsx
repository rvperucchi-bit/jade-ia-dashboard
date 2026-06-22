import React from "react";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  color?: string;
  topOffset?: number;
}

export function BackButton({ color = "rgba(255,255,255,0.65)", topOffset = 8 }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const top = (Platform.OS === "web" ? 24 : insets.top) + topOffset;

  return (
    <TouchableOpacity
      style={[S.btn, { top }]}
      onPress={() => router.back()}
      activeOpacity={0.7}
      hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
    >
      <Feather name="arrow-left" size={19} color={color} />
    </TouchableOpacity>
  );
}

const S = StyleSheet.create({
  btn: {
    position: "absolute",
    left: 14,
    zIndex: 100,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
});
