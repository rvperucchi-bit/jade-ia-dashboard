import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  StyleSheet,
  View,
} from "react-native";

const jadeLogo = require("../assets/images/jade-logo.png");

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const RING_SIZE = Math.min(SCREEN_W * 0.52, Math.min(SCREEN_H * 0.38, 240));

// ─── Timing constants ──────────────────────────────────────────────────────────
const FADE_IN_MS  = 620;   // 0 → 1 opacity + 0.95 → 1 scale
const HOLD_MS     = 820;   // pause at full opacity
const FADE_OUT_MS = 380;   // 1 → 0 opacity before navigation
// Total ≈ 1820 ms

export default function SplashScreen() {
  const router = useRouter();

  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    let isMounted = true;

    (async () => {
      let token: string | null = null;
      try { token = await AsyncStorage.getItem("@jade_ia:auth_token"); } catch {}
      if (!isMounted) return;

      const dest: any = token ? "/(tabs)" : "/login";
      const native = Platform.OS !== "web";

      // ── Web: no native driver — simple opacity only ────────────────────────
      if (!native) {
        Animated.timing(opacity, {
          toValue: 1,
          duration: FADE_IN_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start();
        setTimeout(() => { if (isMounted) router.replace(dest); }, FADE_IN_MS + HOLD_MS);
        return;
      }

      // ── Native: fade-in + scale → hold → fade-out → navigate ──────────────
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: FADE_IN_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: FADE_IN_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => {
          if (!isMounted) return;
          Animated.timing(opacity, {
            toValue: 0,
            duration: FADE_OUT_MS,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }).start(() => {
            if (isMounted) router.replace(dest);
          });
        }, HOLD_MS);
      });
    })();

    return () => { isMounted = false; };
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Image
          source={jadeLogo}
          style={{ width: RING_SIZE, height: RING_SIZE }}
          resizeMode="contain"
          fadeDuration={0}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
});
