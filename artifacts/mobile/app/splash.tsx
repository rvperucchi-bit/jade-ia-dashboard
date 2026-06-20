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

const jadeIcon = require("../assets/images/jade-icon.png");
const jadeWordmark = require("../assets/images/jade-wordmark-orig.png");

const { width: SCREEN_W } = Dimensions.get("window");
const ICON_SIZE = Math.min(SCREEN_W * 0.68, 280);

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.82)).current;
  const wordmarkAnim = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 750,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 750,
          easing: Easing.out(Easing.back(1.12)),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(wordmarkAnim, {
        toValue: 1,
        duration: 450,
        delay: 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    const timer = setTimeout(() => {
      router.replace("/login");
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Icon: circular crop to show the neon circle prominently */}
      <Animated.View
        style={[
          styles.iconContainer,
          { width: ICON_SIZE, height: ICON_SIZE },
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Image
          source={jadeIcon}
          style={{ width: ICON_SIZE, height: ICON_SIZE * 1.5, marginTop: -ICON_SIZE * 0.22 }}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Wordmark */}
      <Animated.View
        style={[
          styles.wordmarkContainer,
          {
            opacity: wordmarkAnim,
            transform: [
              {
                translateY: wordmarkAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Image
          source={jadeWordmark}
          style={styles.wordmarkImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Loading dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                opacity: dotAnim.interpolate({
                  inputRange: [0, 0.33 * (i + 1), 1],
                  outputRange: [0.25, 1, 0.25],
                  extrapolate: "clamp",
                }),
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0F",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    borderRadius: 9999,
    overflow: "hidden",
    alignItems: "center",
  },
  wordmarkContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  wordmarkImage: {
    width: SCREEN_W * 0.72,
    height: (SCREEN_W * 0.72) * (178 / 1024),
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 52,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF0080",
  },
});
