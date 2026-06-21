import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  Vibration,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import * as Haptics from "expo-haptics";
import { setPendingVoice } from "@/utils/voiceContext";

const PINK     = "#FF0080";
const FAB_SIZE = 54;
const TAB_H    = Platform.OS === "web" ? 84 : 60;
const MARGIN   = 16;
const SNAP_KEY = "@jade_fab_position";

function getSnapCorners(screenW: number, screenH: number, insetsBottom: number, insetsTop: number) {
  const minBottom = TAB_H + insetsBottom + 14;
  return {
    BR: { x: screenW - FAB_SIZE - MARGIN, y: screenH - minBottom - FAB_SIZE - MARGIN },
    BL: { x: MARGIN,                       y: screenH - minBottom - FAB_SIZE - MARGIN },
    TR: { x: screenW - FAB_SIZE - MARGIN, y: insetsTop + MARGIN + 30 },
    TL: { x: MARGIN,                       y: insetsTop + MARGIN + 30 },
  };
}

function nearestCorner(x: number, y: number, corners: ReturnType<typeof getSnapCorners>) {
  let best = corners.BR; let bestD = Infinity;
  for (const corner of Object.values(corners)) {
    const d = Math.hypot(x - corner.x, y - corner.y);
    if (d < bestD) { bestD = d; best = corner; }
  }
  return best;
}

export function JADEFab() {
  const router   = useRouter();
  const pathname = usePathname();
  const insets   = useSafeAreaInsets();
  const { width: SW, height: SH } = Dimensions.get("window");

  // ── Animated values ─────────────────────────────────────────────────────────
  const sonar1   = useRef(new Animated.Value(0)).current;
  const sonar2   = useRef(new Animated.Value(0)).current;
  const wave1    = useRef(new Animated.Value(0)).current;
  const wave2    = useRef(new Animated.Value(0)).current;
  const wave3    = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const dragScale   = useRef(new Animated.Value(1)).current;
  const dragOpacity = useRef(new Animated.Value(1)).current;
  const labelOpacity = useRef(new Animated.Value(0)).current;

  // Position
  const corners = getSnapCorners(SW, SH, insets.bottom, insets.top);
  const posRef  = useRef(new Animated.ValueXY(corners.BR)).current;
  const lastPos = useRef(corners.BR);

  const [ready,    setReady]    = useState(false);
  const [pressing, setPressing] = useState(false);

  // Wave loop ref
  const waveLoopRef = useRef<ReturnType<typeof Animated.loop> | null>(null);

  // ── Load saved position ──────────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(SNAP_KEY).then((raw) => {
      if (raw) {
        try {
          const saved = JSON.parse(raw) as { x: number; y: number };
          posRef.setValue(saved);
          lastPos.current = saved;
        } catch { /* ignore */ }
      }
      setReady(true);
    });
  }, []);

  // ── Idle sonar ping (subtle, always on) ─────────────────────────────────────
  useEffect(() => {
    const makeLoop = (anim: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 1800, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 0,    useNativeDriver: false }),
      ]));
    const l1 = makeLoop(sonar1, 0);
    const l2 = makeLoop(sonar2, 900);
    l1.start(); l2.start();
    return () => { l1.stop(); l2.stop(); };
  }, []);

  // ── Wave ring animation (during long press hold) ─────────────────────────────
  const startWaves = () => {
    wave1.setValue(0); wave2.setValue(0); wave3.setValue(0);
    const makeWave = (anim: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: false }),
        ]),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: false }),
        Animated.delay(900 - delay),
      ]));
    waveLoopRef.current = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(wave1, { toValue: 1, duration: 900, useNativeDriver: false }),
          Animated.timing(wave1, { toValue: 0, duration: 0,   useNativeDriver: false }),
        ]),
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(wave2, { toValue: 1, duration: 900, useNativeDriver: false }),
          Animated.timing(wave2, { toValue: 0, duration: 0,   useNativeDriver: false }),
          Animated.delay(0),
        ]),
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(wave3, { toValue: 1, duration: 900, useNativeDriver: false }),
          Animated.timing(wave3, { toValue: 0, duration: 0,   useNativeDriver: false }),
          Animated.delay(0),
        ]),
      ])
    );
    waveLoopRef.current.start();
  };

  const stopWaves = () => {
    waveLoopRef.current?.stop();
    wave1.setValue(0); wave2.setValue(0); wave3.setValue(0);
  };

  // ── PanResponder ─────────────────────────────────────────────────────────────
  const holdTimerRef  = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const holdInterval  = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLongPress   = useRef(false);
  const isDragging    = useRef(false);
  const dragDist      = useRef(0);
  const holdSecs      = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dx, dy }) => Math.hypot(dx, dy) > 5,

      onPanResponderGrant: () => {
        isDragging.current  = false;
        dragDist.current    = 0;
        isLongPress.current = false;

        Animated.timing(btnScale, { toValue: 0.92, duration: 120, useNativeDriver: false }).start();

        holdSecs.current = 0;
        holdTimerRef.current = setTimeout(() => {
          if (!isDragging.current) {
            isLongPress.current = true;
            // Heavy haptic + vibration burst on long press detect
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            Vibration.vibrate([0, 60]);
            // Scale up FAB
            Animated.timing(btnScale, { toValue: 1.12, duration: 180, useNativeDriver: false }).start();
            // Show label
            Animated.timing(labelOpacity, { toValue: 1, duration: 200, useNativeDriver: false }).start();
            // Start wave rings
            startWaves();
            holdInterval.current = setInterval(() => { holdSecs.current += 1; }, 1000);
          }
        }, 300); // 300ms threshold

        posRef.extractOffset();
      },

      onPanResponderMove: (_, { dx, dy }) => {
        dragDist.current = Math.hypot(dx, dy);
        if (dragDist.current > 8) {
          isDragging.current = true;
          if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
          Animated.parallel([
            Animated.timing(dragScale,   { toValue: 1.1,  duration: 100, useNativeDriver: false }),
            Animated.timing(dragOpacity, { toValue: 0.85, duration: 100, useNativeDriver: false }),
          ]).start();
        }
        posRef.setValue({ x: dx, y: dy });
      },

      onPanResponderRelease: (_, { moveX, moveY }) => {
        if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
        if (holdInterval.current) { clearInterval(holdInterval.current); holdInterval.current = null; }
        posRef.flattenOffset();

        // Hide waves + label
        stopWaves();
        Animated.timing(labelOpacity, { toValue: 0, duration: 150, useNativeDriver: false }).start();

        if (isDragging.current) {
          const cur = { x: (posRef.x as any)._value as number, y: (posRef.y as any)._value as number };
          const snapped = nearestCorner(cur.x, cur.y, getSnapCorners(SW, SH, insets.bottom, insets.top));
          Animated.parallel([
            Animated.spring(posRef, { toValue: snapped, useNativeDriver: false, tension: 200, friction: 20 }),
            Animated.timing(dragScale,   { toValue: 1, duration: 200, useNativeDriver: false }),
            Animated.timing(dragOpacity, { toValue: 1, duration: 200, useNativeDriver: false }),
          ]).start();
          Animated.timing(btnScale, { toValue: 1, duration: 150, useNativeDriver: false }).start();
          lastPos.current = snapped;
          AsyncStorage.setItem(SNAP_KEY, JSON.stringify(snapped)).catch(() => {});
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
          Animated.timing(btnScale,    { toValue: 1, duration: 150, useNativeDriver: false }).start();
          Animated.timing(dragScale,   { toValue: 1, duration: 150, useNativeDriver: false }).start();
          Animated.timing(dragOpacity, { toValue: 1, duration: 150, useNativeDriver: false }).start();

          if (isLongPress.current) {
            const secs = Math.max(1, holdSecs.current);
            setPendingVoice(secs);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Vibration.vibrate([0, 40]);
          } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          (router as any).push("/(tabs)/jade");
        }

        isDragging.current  = false;
        isLongPress.current = false;
        dragDist.current    = 0;
      },
    })
  ).current;

  if (pathname === "/(tabs)/jade" || pathname === "/jade") return null;
  if (!ready) return null;

  const sonarStyle = (anim: Animated.Value) => ({
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
    opacity:   anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.35, 0.12, 0] }),
  });

  const waveStyle = (anim: Animated.Value) => ({
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.0] }) }],
    opacity:   anim.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 0.7, 0.4, 0] }),
  });

  return (
    <Animated.View
      style={[F.wrap, { transform: posRef.getTranslateTransform() }]}
      {...panResponder.panHandlers}
    >
      {/* Idle sonar rings */}
      <Animated.View style={[F.ring, sonarStyle(sonar1)]} pointerEvents="none" />
      <Animated.View style={[F.ring, sonarStyle(sonar2)]} pointerEvents="none" />

      {/* Long-press wave rings — only visible during hold */}
      <Animated.View style={[F.waveRing, waveStyle(wave1)]} pointerEvents="none" />
      <Animated.View style={[F.waveRing, waveStyle(wave2)]} pointerEvents="none" />
      <Animated.View style={[F.waveRing, waveStyle(wave3)]} pointerEvents="none" />

      {/* FAB button */}
      <Animated.View style={[F.fab, {
        transform: [{ scale: Animated.multiply(btnScale, dragScale) }],
        opacity: dragOpacity,
      }]}>
        <MaterialCommunityIcons name="robot" size={26} color="#fff" />
      </Animated.View>

      {/* "Solte para enviar" label — appears during hold */}
      <Animated.View style={[F.label, { opacity: labelOpacity }]} pointerEvents="none">
        <Text style={F.labelText}>Solte para enviar</Text>
      </Animated.View>
    </Animated.View>
  );
}

const F = StyleSheet.create({
  wrap: {
    position: "absolute", top: 0, left: 0,
    width: FAB_SIZE, height: FAB_SIZE,
    alignItems: "center", justifyContent: "center",
    zIndex: 999,
    overflow: "visible",
  },
  ring: {
    position: "absolute",
    width: FAB_SIZE, height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    borderWidth: 1.5, borderColor: PINK,
  },
  waveRing: {
    position: "absolute",
    width: FAB_SIZE, height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    borderWidth: 2, borderColor: PINK,
    backgroundColor: "rgba(255,0,128,0.06)",
  },
  fab: {
    width: FAB_SIZE, height: FAB_SIZE, borderRadius: FAB_SIZE / 2,
    backgroundColor: PINK,
    alignItems: "center", justifyContent: "center",
    shadowColor: PINK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 12,
  },
  label: {
    position: "absolute",
    bottom: -28,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8,
    width: 130,
    alignItems: "center",
  },
  labelText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "SpaceGrotesk_600SemiBold",
  },
});
