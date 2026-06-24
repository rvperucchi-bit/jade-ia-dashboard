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

const { width: SCREEN_W } = Dimensions.get("window");
const LOGO_SIZE = Math.min(SCREEN_W * 0.44, 200);

export default function SplashScreen() {
  const router = useRouter();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const native = Platform.OS !== "web";

    // Na web o callback do Animated pode não disparar — usamos setTimeout direto
    if (!native) {
      const t = setTimeout(() => router.replace("/login"), 1800);
      logoOpacity.setValue(1);
      return () => clearTimeout(t);
    }

    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoRotate, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 420,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          router.replace("/login");
        });
      }, 900);
    });
  }, []);

  const rotate = logoRotate.interpolate({
    inputRange:  [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: logoOpacity,
          transform: [{ rotate }],
        }}
      >
        <Image
          source={jadeLogo}
          style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
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
