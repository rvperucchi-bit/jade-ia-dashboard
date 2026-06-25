import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCredits } from "@/context/CreditsContext";
import { usePlan } from "@/context/PlanContext";
import { useRadarSearches } from "@/hooks/useRadarSearches";
import { useColors } from "@/hooks/useColors";

const PINK   = "#FF0080";
const PURPLE = "#8400FF";
const GOLD   = "#F59E0B";

const C = {
  bg:      "#0A0A0F",
  card:    "#111118",
  border:  "#252535",
  text:    "#FFFFFF",
  muted:   "#8A8A9A",
  sub:     "#8A8A9A",
  surface: "#1A1A26",
};

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

// ─── Pacotes ──────────────────────────────────────────────────────────────────
const MSG_PACKAGES = [
  { id: "500",   amount: 500,   price: "R$29,90",  label: "500 mensagens",    sub: "Ideal para testar",        popular: false },
  { id: "2000",  amount: 2000,  price: "R$89,90",  label: "2.000 mensagens",  sub: "Mais popular",             popular: true  },
  { id: "5000",  amount: 5000,  price: "R$179,90", label: "5.000 mensagens",  sub: "Melhor custo-benefício",  popular: false },
  { id: "10000", amount: 10000, price: "R$299,90", label: "10.000 mensagens", sub: "Para times ativos",        popular: false },
];

const RADAR_PACKAGES = [
  { id: "50",   amount: 50,   price: "R$29,90",  label: "50 buscas",    sub: "até 1.000 leads",  popular: false },
  { id: "200",  amount: 200,  price: "R$79,90",  label: "200 buscas",   sub: "até 4.000 leads",  popular: true  },
  { id: "500",  amount: 500,  price: "R$149,90", label: "500 buscas",   sub: "até 10.000 leads", popular: false },
  { id: "1000", amount: 1000, price: "R$249,90", label: "1.000 buscas", sub: "até 20.000 leads", popular: false },
];

// ─── Upgrade info por plano ───────────────────────────────────────────────────
type UpgradeInfo = { label: string; price: string; color: string; benefits: string[] };

const PLAN_UPGRADE: Record<string, UpgradeInfo | null> = {
  start: {
    label: "Pro", price: "R$247/mês", color: PURPLE,
    benefits: ["3 usuários incluídos", "2.000 mensagens WhatsApp/mês", "200 buscas Radar/mês", "Objeções IA, Roleplay, Marketing IA"],
  },
  pro: {
    label: "Enterprise", price: "R$697/mês", color: GOLD,
    benefits: ["8 usuários incluídos", "5.000 mensagens WhatsApp/mês", "500 buscas Radar/mês", "Painel Executivo, Gestão de Time"],
  },
  enterprise: null,
};

// ─── Package Card ─────────────────────────────────────────────────────────────
function PkgCard({
  item, selected, onPress,
}: {
  item: { id: string; price: string; label: string; sub: string; popular: boolean };
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        S.pkgCard,
        { borderColor: selected ? PINK : C.border, backgroundColor: selected ? "#FF008012" : C.card },
        selected && { borderWidth: 2 },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {item.popular && (
        <View style={S.popularBadge}>
          <Text style={S.popularBadgeText}>⭐ Mais popular</Text>
        </View>
      )}
      <View style={S.pkgRow}>
        <View style={[S.pkgRadio, {
          borderColor: selected ? PINK : "#444",
          backgroundColor: selected ? PINK : "transparent",
        }]}>
          {selected && <Feather name="check" size={12} color="#fff" />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[S.pkgLabel, { color: selected ? C.text : C.sub }]}>{item.label}</Text>
          <Text style={[S.pkgSub, { color: C.muted }]}>{item.sub}</Text>
        </View>
        <Text style={[S.pkgPrice, { color: selected ? PINK : C.sub }]}>{item.price}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Balance Card ─────────────────────────────────────────────────────────────
function BalanceCard({ remaining, used, total, icon, label }: {
  remaining: number; used: number; total: number; icon: string; label: string;
}) {
  const pct = total > 0 ? remaining / total : 0;
  const warn = remaining === 0 ? "rgba(255,255,255,0.5)" : remaining < total * 0.2 ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.55)";
  return (
    <View style={S.balanceCard}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
          <Feather name={icon as any} size={15} color={C.muted} />
          <Text style={S.balanceLabel}>{label}</Text>
        </View>
        <Text style={[S.balanceValue, { color: warn }]}>{remaining} restantes</Text>
      </View>
      <View style={S.barTrack}>
        <View style={[S.barFill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: warn }]} />
      </View>
      <Text style={S.balanceHint}>{used} / {total} usados este mês</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function LojaScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const colors  = useColors();
  const topPad  = Platform.OS === "web" ? 24 : insets.top + 4;
  const params  = useLocalSearchParams<{ tab?: string }>();
  const credits = useCredits();
  const radar   = useRadarSearches();
  const { userPlan } = usePlan();

  const [activeTab, setActiveTab] = useState<0 | 1>(params.tab === "1" ? 1 : 0);
  const [selectedMsg,   setSelectedMsg]   = useState<string | null>(null);
  const [selectedRadar, setSelectedRadar] = useState<string | null>(null);
  const [buying, setBuying] = useState(false);

  const upgradeInfo = PLAN_UPGRADE[userPlan] ?? null;

  const openCheckout = async (url: string) => {
    if (Platform.OS === "web") {
      await Linking.openURL(url);
    } else {
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: "#0B0814",
        controlsColor: PINK,
        showTitle: false,
      });
    }
  };

  const handleBuyMsg = async () => {
    if (!selectedMsg || buying) return;
    setBuying(true);
    try {
      const res = await fetch(`${API_BASE}/api/stripe/create-checkout-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pacote: selectedMsg, email: "contato@jadeia.com.br" }),
      });
      if (!res.ok) throw new Error("Erro no servidor");
      const data = await res.json() as { url?: string };
      if (data.url) await openCheckout(data.url);
    } catch {
      Alert.alert("Erro", "Não foi possível iniciar o checkout. Tente novamente.");
    } finally {
      setBuying(false);
    }
  };

  const handleBuyRadar = async () => {
    if (!selectedRadar || buying) return;
    setBuying(true);
    try {
      const res = await fetch(`${API_BASE}/api/stripe/create-checkout-searches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pacote: selectedRadar, email: "contato@jadeia.com.br" }),
      });
      if (!res.ok) throw new Error("Erro no servidor");
      const data = await res.json() as { url?: string };
      if (data.url) await openCheckout(data.url);
    } catch {
      Alert.alert("Erro", "Não foi possível iniciar o checkout. Tente novamente.");
    } finally {
      setBuying(false);
    }
  };

  const switchTab = (t: 0 | 1) => {
    setActiveTab(t);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[S.header, { paddingTop: topPad }]}>
        <TouchableOpacity onPress={() => router.back()} style={S.backBtn} activeOpacity={0.7}>
          <Feather name="chevron-left" size={22} color={C.text} />
        </TouchableOpacity>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Feather name="shopping-cart" size={18} color={PINK} />
          <Text style={S.headerTitle}>Loja JADE</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Tabs ── */}
      <View style={S.tabRow}>
        <TouchableOpacity
          style={[S.tabBtn, activeTab === 0 && { borderBottomColor: PINK }]}
          onPress={() => switchTab(0)}
          activeOpacity={0.8}
        >
          <Feather name="message-circle" size={16} color={activeTab === 0 ? PINK : C.muted} />
          <Text style={[S.tabText, { color: activeTab === 0 ? PINK : C.muted }]}>Mensagens</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[S.tabBtn, activeTab === 1 && { borderBottomColor: PINK }]}
          onPress={() => switchTab(1)}
          activeOpacity={0.8}
        >
          <Feather name="radio" size={16} color={activeTab === 1 ? PINK : C.muted} />
          <Text style={[S.tabText, { color: activeTab === 1 ? PINK : C.muted }]}>Buscas Radar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[S.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 0 ? (
          /* ─── TAB: MENSAGENS ─── */
          <View style={S.tabContent}>
            <View style={{ gap: 4 }}>
              <Text style={S.tabTitle}>Recarregar mensagens WhatsApp</Text>
              <Text style={S.tabSub}>Cada crédito = 1 mensagem enviada pela JADE</Text>
            </View>

            <BalanceCard
              remaining={credits.remaining} used={credits.used}
              total={credits.total} icon="message-circle" label="Créditos de mensagens"
            />

            <View style={{ gap: 12 }}>
              {MSG_PACKAGES.map((pkg) => (
                <PkgCard
                  key={pkg.id}
                  item={pkg}
                  selected={selectedMsg === pkg.id}
                  onPress={() => setSelectedMsg(selectedMsg === pkg.id ? null : pkg.id)}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[S.buyBtn, { opacity: selectedMsg && !buying ? 1 : 0.4 }]}
              onPress={handleBuyMsg}
              activeOpacity={0.85}
              disabled={!selectedMsg || buying}
            >
              {buying ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="credit-card" size={18} color="#fff" />
                  <Text style={S.buyBtnText}>Comprar agora</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* ─── TAB: RADAR ─── */
          <View style={S.tabContent}>
            <View style={{ gap: 4 }}>
              <Text style={S.tabTitle}>Recarregar buscas no Radar</Text>
              <Text style={S.tabSub}>Cada busca retorna até 20 leads da região</Text>
            </View>

            <BalanceCard
              remaining={radar.remaining} used={radar.used}
              total={radar.total} icon="radio" label="Buscas Radar"
            />

            <View style={{ gap: 12 }}>
              {RADAR_PACKAGES.map((pkg) => (
                <PkgCard
                  key={pkg.id}
                  item={pkg}
                  selected={selectedRadar === pkg.id}
                  onPress={() => setSelectedRadar(selectedRadar === pkg.id ? null : pkg.id)}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[S.buyBtn, { opacity: selectedRadar && !buying ? 1 : 0.4 }]}
              onPress={handleBuyRadar}
              activeOpacity={0.85}
              disabled={!selectedRadar || buying}
            >
              {buying ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="credit-card" size={18} color="#fff" />
                  <Text style={S.buyBtnText}>Comprar agora</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Upgrade Section ─── */}
        <View style={S.upgradeSection}>
          <View style={S.upgradeDividerRow}>
            <View style={S.dividerLine} />
            <Text style={S.dividerText}>OU FAÇA UPGRADE DO SEU PLANO</Text>
            <View style={S.dividerLine} />
          </View>

          {upgradeInfo ? (
            <TouchableOpacity
              style={[S.upgradeCard, { borderColor: upgradeInfo.color + "66", backgroundColor: upgradeInfo.color + "0A" }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/plano" as any); }}
              activeOpacity={0.85}
            >
              <View style={S.upgradeCardHeader}>
                <View style={[S.upgradeBadge, { backgroundColor: upgradeInfo.color + "22" }]}>
                  <Text style={[S.upgradeBadgeText, { color: upgradeInfo.color }]}>✦ {upgradeInfo.label.toUpperCase()}</Text>
                </View>
                <Text style={[S.upgradePrice, { color: upgradeInfo.color }]}>{upgradeInfo.price}</Text>
              </View>

              <View style={{ gap: 8, marginTop: 12, marginBottom: 16 }}>
                {upgradeInfo.benefits.map((b, i) => (
                  <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Feather name="check-circle" size={14} color={upgradeInfo.color} />
                    <Text style={[S.upgradeBenefit, { color: upgradeInfo.color + "CC" }]}>{b}</Text>
                  </View>
                ))}
              </View>

              <View style={[S.upgradeBtn, { backgroundColor: upgradeInfo.color }]}>
                <Text style={S.upgradeBtnText}>
                  Upgrade para {upgradeInfo.label} → {upgradeInfo.price}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={[S.upgradeCard, { borderColor: GOLD + "44", backgroundColor: GOLD + "0A", alignItems: "center", paddingVertical: 28 }]}>
              <Text style={{ fontSize: 36, marginBottom: 10 }}>🎉</Text>
              <Text style={{ fontSize: 17, fontFamily: "SpaceGrotesk_700Bold", color: GOLD, textAlign: "center" }}>
                Você já está no plano máximo!
              </Text>
              <Text style={{ fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: C.muted, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
                Aproveite todos os recursos Enterprise e compre créditos extras quando precisar.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  backBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold", color: C.text },

  tabRow:  { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  tabBtn:  { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderBottomWidth: 2.5, borderBottomColor: "transparent" },
  tabText: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },

  scroll:      { paddingHorizontal: 20, paddingTop: 24 },
  tabContent:  { gap: 18 },

  tabTitle: { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold", color: C.text },
  tabSub:   { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", color: C.muted, lineHeight: 19 },

  balanceCard:  { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16 },
  balanceLabel: { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium", color: C.muted },
  balanceValue: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  barTrack:     { height: 7, backgroundColor: C.surface, borderRadius: 4, overflow: "hidden", position: "relative" },
  barFill:      { position: "absolute", top: 0, left: 0, bottom: 0, borderRadius: 4 },
  balanceHint:  { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", color: C.muted, marginTop: 8 },

  pkgCard:    { borderRadius: 14, borderWidth: 1.5, padding: 16, position: "relative" },
  pkgRow:     { flexDirection: "row", alignItems: "center", gap: 12 },
  pkgRadio:   { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  pkgLabel:   { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  pkgSub:     { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  pkgPrice:   { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  popularBadge:     { position: "absolute", top: -10, right: 12, backgroundColor: PINK, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, zIndex: 1 },
  popularBadgeText: { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },

  buyBtn: {
    backgroundColor: PINK, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, height: 54, borderRadius: 14,
    shadowColor: PINK, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  buyBtnText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },

  upgradeSection:   { marginTop: 36, gap: 18, paddingBottom: 8 },
  upgradeDividerRow:{ flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine:      { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: C.border },
  dividerText:      { fontSize: 10, fontFamily: "SpaceGrotesk_600SemiBold", color: C.muted, letterSpacing: 1 },

  upgradeCard:       { borderRadius: 16, borderWidth: 1.5, padding: 18 },
  upgradeCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  upgradeBadge:      { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  upgradeBadgeText:  { fontSize: 12, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 0.5 },
  upgradePrice:      { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  upgradeBenefit:    { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 19, flex: 1 },
  upgradeBtn:        { borderRadius: 12, height: 46, alignItems: "center", justifyContent: "center" },
  upgradeBtnText:    { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
});
