import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import * as Haptics from "expo-haptics";
import { setPendingVoice } from "@/utils/voiceContext";

const PINK     = "#FF0080";
const FAB_SIZE = 60;
const TAB_H    = Platform.OS === "web" ? 84 : 60;

export function JADEFab() {
  const router   = useRouter();
  const pathname = usePathname();
  const insets   = useSafeAreaInsets();

  const ring1   = useRef(new Animated.Value(0)).current;
  const ring2   = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  const holdTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdStartRef  = useRef(0);
  const isHoldingRef  = useRef(false);

  // Sonar ping loop — two rings staggered
  useEffect(() => {
    const makeLoop = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: false }),
          Animated.timing(anim, { toValue: 0, duration: 0,    useNativeDriver: false }),
        ])
      );
    const l1 = makeLoop(ring1, 0);
    const l2 = makeLoop(ring2, 900);
    l1.start();
    l2.start();
    return () => { l1.stop(); l2.stop(); };
  }, []);

  const onPressIn = () => {
    holdStartRef.current  = Date.now();
    isHoldingRef.current  = false;
    Animated.timing(btnScale, { toValue: 0.92, duration: 120, useNativeDriver: false }).start();
    holdTimerRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Animated.timing(btnScale, { toValue: 1.08, duration: 200, useNativeDriver: false }).start();
    }, 400);
  };

  const onPressOut = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    Animated.timing(btnScale, { toValue: 1, duration: 150, useNativeDriver: false }).start();

    if (isHoldingRef.current) {
      const secs = Math.max(1, Math.floor((Date.now() - holdStartRef.current) / 1000));
      setPendingVoice(secs);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    isHoldingRef.current = false;
    router.push("/(tabs)/jade" as any);
  };

  // Hide on JADE tab itself
  if (pathname === "/(tabs)/jade" || pathname === "/jade") return null;

  const bottom = TAB_H + insets.bottom + 14;

  const ringStyle = (anim: Animated.Value) => ({
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
    opacity:   anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.55, 0.15, 0] }),
  });

  return (
    <View style={[F.wrap, { bottom, right: 18 }]} pointerEvents="box-none">
      <Animated.View style={[F.ring, ringStyle(ring1)]} pointerEvents="none" />
      <Animated.View style={[F.ring, ringStyle(ring2)]} pointerEvents="none" />
      <TouchableOpacity
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={F.touch}
      >
        <Animated.View style={[F.fab, { transform: [{ scale: btnScale }] }]}>
          <MaterialCommunityIcons name="robot" size={28} color="#fff" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const F = StyleSheet.create({
  wrap:  { position: "absolute", width: FAB_SIZE, height: FAB_SIZE, alignItems: "center", justifyContent: "center" },
  ring:  { position: "absolute", width: FAB_SIZE, height: FAB_SIZE, borderRadius: FAB_SIZE / 2, borderWidth: 1.5, borderColor: PINK },
  touch: { width: FAB_SIZE, height: FAB_SIZE, alignItems: "center", justifyContent: "center" },
  fab:   {
    width: FAB_SIZE, height: FAB_SIZE, borderRadius: FAB_SIZE / 2,
    backgroundColor: PINK,
    alignItems: "center", justifyContent: "center",
    shadowColor: PINK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 12,
  },
});
