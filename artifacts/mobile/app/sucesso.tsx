import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const C = {
  bg:      "#0B0814",
  card:    "#111118",
  border:  "#1E1E2E",
  text:    "#FFFFFF",
  muted:   "#7777AA",
  primary: "#FF0080",
  success: "#00D68F",
  surface: "#16161F",
};

export default function SucessoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const scaleAnim   = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(120),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGoToApp = () => {
    router.replace("/(tabs)" as any);
  };

  const topPad = Platform.OS === "web" ? 60 : insets.top + 20;

  return (
    <View style={[S.root, { paddingTop: topPad, paddingBottom: insets.bottom + 32 }]}>
      <View style={S.center}>
        <Animated.View style={[S.iconWrap, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          <View style={S.iconRing}>
            <Feather name="check" size={52} color={C.success} />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: opacityAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={S.title}>Pagamento confirmado! 🎉</Text>
          <Text style={S.subtitle}>Seu plano foi ativado.{"\n"}Bora vender!</Text>

          <View style={S.card}>
            {[
              "IA de vendas liberada",
              "Créditos adicionados à conta",
              "Acesso imediato a todos os recursos",
            ].map((item, i) => (
              <View key={i} style={S.checkRow}>
                <View style={S.checkDot}>
                  <Feather name="check" size={12} color={C.success} />
                </View>
                <Text style={S.checkText}>{item}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>

      <Animated.View style={{ opacity: opacityAnim }}>
        <TouchableOpacity style={S.btn} activeOpacity={0.85} onPress={handleGoToApp}>
          <Text style={S.btnText}>Ir para o app</Text>
          <Feather name="arrow-right" size={18} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const S = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
  },
  iconWrap: { alignItems: "center", marginBottom: 4 },
  iconRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: C.success + "18",
    borderWidth: 2,
    borderColor: C.success + "55",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontFamily: "SpaceGrotesk_700Bold",
    color: C.text,
    textAlign: "center",
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 17,
    fontFamily: "SpaceGrotesk_400Regular",
    color: C.muted,
    textAlign: "center",
    lineHeight: 26,
    marginTop: 8,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    gap: 14,
    marginTop: 24,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.success + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: {
    fontSize: 14,
    fontFamily: "SpaceGrotesk_500Medium",
    color: C.text,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 56,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
  btnText: {
    fontSize: 17,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#fff",
  },
});
