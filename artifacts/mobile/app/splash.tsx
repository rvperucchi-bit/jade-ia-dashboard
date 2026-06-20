import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(taglineAnim, {
        toValue: 1,
        duration: 500,
        delay: 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const timer = setTimeout(() => {
      router.replace("/login");
    }, 2600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoWrap,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.logoRow}>
          <Text style={styles.logoJ}>J</Text>
          <Text style={styles.logoA}>A</Text>
          <Text style={styles.logoDE}>DE</Text>
        </View>
        <View style={styles.badgeRow}>
          <Text style={styles.badgeText}>IA</Text>
        </View>
      </Animated.View>

      <Animated.Text
        style={[
          styles.tagline,
          {
            opacity: taglineAnim,
            transform: [
              {
                translateY: taglineAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          },
        ]}
      >
        Sua parceira de trabalho.
      </Animated.Text>

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
    gap: 20,
  },
  logoWrap: {
    alignItems: "center",
    gap: 8,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  logoJ: {
    fontSize: 80,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#FFFFFF",
    lineHeight: 88,
  },
  logoA: {
    fontSize: 80,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#FF0080",
    lineHeight: 88,
  },
  logoDE: {
    fontSize: 80,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#FFFFFF",
    lineHeight: 88,
  },
  badgeRow: {
    backgroundColor: "#FF008022",
    borderWidth: 1,
    borderColor: "#FF008055",
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 15,
    fontFamily: "SpaceGrotesk_600SemiBold",
    color: "#FF0080",
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 16,
    fontFamily: "SpaceGrotesk_400Regular",
    color: "#FFFFFF88",
    letterSpacing: 0.5,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 40,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF0080",
  },
});
