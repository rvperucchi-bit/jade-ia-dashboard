import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, usePathname } from "expo-router";
import * as Haptics from "expo-haptics";
import { setPendingVoice } from "@/utils/voiceContext";

const PINK     = "#FF0080";
const FAB_SIZE = 54;          // 10% smaller than 60px
const TAB_H    = Platform.OS === "web" ? 84 : 60;
const MARGIN   = 16;
const SNAP_KEY = "@jade_fab_position";

// ring opacity max 0.4 (30% more subtle)
const RING_OPACITY_MAX = 0.4;

function getSnapCorners(
  screenW: number,
  screenH: number,
  insetsBottom: number,
  insetsTop: number,
) {
  const minBottom = TAB_H + insetsBottom + 14;
  return {
    BR: { x: screenW - FAB_SIZE - MARGIN,     y: screenH - minBottom - FAB_SIZE - MARGIN },
    BL: { x: MARGIN,                           y: screenH - minBottom - FAB_SIZE - MARGIN },
    TR: { x: screenW - FAB_SIZE - MARGIN,     y: insetsTop + MARGIN + 30 },
    TL: { x: MARGIN,                           y: insetsTop + MARGIN + 30 },
  };
}

function nearestCorner(
  x: number,
  y: number,
  corners: ReturnType<typeof getSnapCorners>,
): { x: number; y: number } {
  let best = corners.BR;
  let bestD = Infinity;
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

  // ── Animated values ──────────────────────────────────────────────────────────
  const ring1    = useRef(new Animated.Value(0)).current;
  const ring2    = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const dragScale = useRef(new Animated.Value(1)).current;
  const dragOpacity = useRef(new Animated.Value(1)).current;

  // Position (x from left, y from top)
  const corners = getSnapCorners(SW, SH, insets.bottom, insets.top);
  const posRef  = useRef(new Animated.ValueXY(corners.BR)).current;
  const lastPos = useRef(corners.BR);

  // ── Load saved position ───────────────────────────────────────────────────
  const [ready, setReady] = useState(false);
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

  // ── Sonar ping loop (30% more subtle) ─────────────────────────────────────
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

  // ── Long press / tap logic ────────────────────────────────────────────────
  const holdTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdInterval  = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLongPress   = useRef(false);
  const isDragging    = useRef(false);
  const dragDist      = useRef(0);
  const holdSecs      = useRef(0);

  // ── PanResponder (drag) ───────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, { dx, dy }) => Math.hypot(dx, dy) > 5,

      onPanResponderGrant: () => {
        isDragging.current = false;
        dragDist.current   = 0;
        isLongPress.current = false;

        // Scale down (press in)
        Animated.timing(btnScale, { toValue: 0.92, duration: 120, useNativeDriver: false }).start();

        // Long press timer for voice — track actual held duration
        holdSecs.current = 0;
        holdTimerRef.current = setTimeout(() => {
          if (!isDragging.current) {
            isLongPress.current = true;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            Animated.timing(btnScale, { toValue: 1.08, duration: 200, useNativeDriver: false }).start();
            holdInterval.current = setInterval(() => { holdSecs.current += 1; }, 1000);
          }
        }, 450);

        posRef.extractOffset();
      },

      onPanResponderMove: (_, { dx, dy }) => {
        dragDist.current = Math.hypot(dx, dy);

        if (dragDist.current > 8) {
          isDragging.current = true;
          if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }

          // Drag visual feedback
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

        if (isDragging.current) {
          // Snap to nearest corner
          const cur = { x: (posRef.x as any)._value as number, y: (posRef.y as any)._value as number };
          const snapped = nearestCorner(cur.x, cur.y, getSnapCorners(SW, SH, insets.bottom, insets.top));

          Animated.parallel([
            Animated.spring(posRef, { toValue: snapped, useNativeDriver: false, tension: 200, friction: 20 }),
            Animated.timing(dragScale,   { toValue: 1,  duration: 200, useNativeDriver: false }),
            Animated.timing(dragOpacity, { toValue: 1,  duration: 200, useNativeDriver: false }),
          ]).start();
          Animated.timing(btnScale, { toValue: 1, duration: 150, useNativeDriver: false }).start();

          lastPos.current = snapped;
          AsyncStorage.setItem(SNAP_KEY, JSON.stringify(snapped)).catch(() => {});
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        } else {
          // Tap or long press
          Animated.timing(btnScale, { toValue: 1, duration: 150, useNativeDriver: false }).start();
          Animated.timing(dragScale,   { toValue: 1, duration: 150, useNativeDriver: false }).start();

          if (isLongPress.current) {
            const secs = Math.max(1, holdSecs.current);
            setPendingVoice(secs);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

  // Hide on JADE tab
  if (pathname === "/(tabs)/jade" || pathname === "/jade") return null;
  if (!ready) return null;

  const ringStyle = (anim: Animated.Value) => ({
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) }],
    opacity:   anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [RING_OPACITY_MAX, 0.12, 0] }),
  });

  return (
    <Animated.View
      style={[F.wrap, { transform: posRef.getTranslateTransform() }]}
      {...panResponder.panHandlers}
    >
      <Animated.View style={[F.ring, ringStyle(ring1)]} pointerEvents="none" />
      <Animated.View style={[F.ring, ringStyle(ring2)]} pointerEvents="none" />
      <Animated.View style={[F.fab, { transform: [{ scale: Animated.multiply(btnScale, dragScale) }], opacity: dragOpacity }]}>
        <MaterialCommunityIcons name="robot" size={26} color="#fff" />
      </Animated.View>
    </Animated.View>
  );
}

const F = StyleSheet.create({
  wrap: { position: "absolute", top: 0, left: 0, width: FAB_SIZE, height: FAB_SIZE, alignItems: "center", justifyContent: "center", zIndex: 999 },
  ring: { position: "absolute", width: FAB_SIZE, height: FAB_SIZE, borderRadius: FAB_SIZE / 2, borderWidth: 1.5, borderColor: PINK },
  fab:  {
    width: FAB_SIZE, height: FAB_SIZE, borderRadius: FAB_SIZE / 2,
    backgroundColor: PINK,
    alignItems: "center", justifyContent: "center",
    shadowColor: PINK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
});
