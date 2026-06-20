import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  View,
} from "react-native";

const jadeLogo = require("../assets/images/jade-logo.png");

const { width: SCREEN_W } = Dimensions.get("window");
// +6% vs original 0.78
const LOGO_W = Math.min(SCREEN_W * 0.827, 382);

export default function SplashScreen() {
  const router = useRouter();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale   = useRef(new Animated.Value(0.88)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;
  const dotAnim     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1 — Logo fades in smoothly (premium slow)
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.back(1.05)),
        useNativeDriver: true,
      }),
    ]).start();

    // 2 — Dots appear 900ms after logo starts
    setTimeout(() => {
      Animated.timing(dotsOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(dotAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(dotAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    }, 900);

    // 3 — Navigate after full premium reveal
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
        }}
      >
        <Image
          source={jadeLogo}
          style={{ width: LOGO_W, height: LOGO_W * (683 / 1024) }}
          resizeMode="contain"
          fadeDuration={0}
        />
      </Animated.View>

      {/* Loading dots — appear after logo */}
      <Animated.View style={[styles.dotsRow, { opacity: dotsOpacity }]}>
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                opacity: dotAnim.interpolate({
                  inputRange: [0, 0.33 * (i + 1), 1],
                  outputRange: [0.2, 1, 0.2],
                  extrapolate: "clamp",
                }),
              },
            ]}
          />
        ))}
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
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 48,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF0080",
  },
});
