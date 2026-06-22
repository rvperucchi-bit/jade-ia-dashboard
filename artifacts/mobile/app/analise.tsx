import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { stripMarkdown } from "@/utils/stripMarkdown";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { useJADE } from "@/hooks/useJADE";


function GapBar({
  label, count, total, color,
}: { label: string; count: number; total: number; color: string }) {
  const colors = useColors();
  const pct = total > 0 ? count / total : 0;
  return (
    <View style={GB.row}>
      <Text style={[GB.label, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={GB.barWrap}>
        <View style={[GB.barTrack, { backgroundColor: colors.surface }]}>
          <View style={[GB.barFill, { width: `${Math.max(pct * 100, 2)}%` as any, backgroundColor: color }]} />
        </View>
        <Text style={[GB.count, { color: colors.text }]}>{count}</Text>
        <Text style={[GB.pct, { color: colors.mutedForeground }]}>
          {total > 0 ? `${Math.round(pct * 100)}%` : "—"}
        </Text>
      </View>
    </View>
  );
}

const GB = StyleSheet.create({
  row:     { gap: 8, marginBottom: 14 },
  label:   { fontSize: 13, fontFamily: "SpaceGrotesk_500Medium" },
  barWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  barTrack:{ flex: 1, height: 10, borderRadius: 5, overflow: "hidden" },
  barFill: { height: 10, borderRadius: 5 },
  count:   { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", width: 28, textAlign: "right" },
  pct:     { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", width: 34, textAlign: "right" },
});

function KpiCard({ label, value, sub, icon, color, }: { label: string; value: string; sub: string; icon: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[KC.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[KC.iconWrap, { backgroundColor: "rgba(255,255,255,0.06)" }]}>
        <Feather name={icon as any} size={18} color={color} />
      </View>
      <Text style={[KC.value, { color: colors.text }]}>{value}</Text>
      <Text style={[KC.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[KC.sub, { color: color }]}>{sub}</Text>
    </View>
  );
}

const KC = StyleSheet.create({
  card:    { flex: 1, minWidth: "47%", borderRadius: 16, borderWidth: 1, padding: 16, gap: 4 },
  iconWrap:{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  value:   { fontSize: 26, fontFamily: "SpaceGrotesk_700Bold" },
  label:   { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  sub:     { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", marginTop: 4 },
});

export default function AnaliseScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { leads, conversations } = useApp();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { loading: gerando, error: jadeError, result: analise, generate } = useJADE();

  // ─── KPIs ─────────────────────────────────────────────────────────────────
  const total      = leads.length;
  const novos      = leads.filter((l) => l.column === "novo").length;
  const qualif     = leads.filter((l) => l.column === "qualificado").length;
  const proposta   = leads.filter((l) => l.column === "proposta").length;
  const fechados   = leads.filter((l) => l.column === "fechado");
  const txConv     = total > 0 ? Math.round((fechados.length / total) * 100) : 0;
  const receita    = fechados.reduce((s, l) => s + l.value, 0);
  const ticket     = fechados.length > 0 ? Math.round(receita / fechados.length) : 0;
  const msgNaoLidas = conversations.filter((c) => c.unread > 0).length;

  // ─── Gap analysis helpers ─────────────────────────────────────────────────
  const stages = [
    { label: "Leads Novos",     count: novos,           color: "#FF0080" },
    { label: "Qualificados",    count: qualif,           color: "#8400FF" },
    { label: "Proposta",        count: proposta,         color: "#FF0080" },
    { label: "Fechados",        count: fechados.length,  color: "rgba(255,255,255,0.55)" },
  ];

  // Find biggest drop-off
  const drops = [
    { from: "Novo → Qualificado",    rate: novos      > 0 ? qualif   / novos   : 0 },
    { from: "Qualificado → Proposta", rate: qualif    > 0 ? proposta / qualif  : 0 },
    { from: "Proposta → Fechado",    rate: proposta   > 0 ? fechados.length / proposta : 0 },
  ];
  const biggestGap = [...drops].sort((a, b) => a.rate - b.rate)[0];

  const gerarAnalise = async () => {
    if (total === 0) {
      Alert.alert("Sem dados", "Adicione leads ao pipeline para gerar uma análise.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const piStr = stages.map((s) => `${s.label}: ${s.count}`).join(", ");
    const dropStr = drops
      .map((d) => `${d.from}: ${d.rate > 0 ? Math.round(d.rate * 100) + "%" : "—"}`)
      .join(", ");
    await generate(`Você é a JADE, especialista em vendas B2B. Analise os dados do pipeline e gere uma análise de gaps objetiva.\n\nDADOS:\n- Pipeline: ${piStr}\n- Total leads: ${total}\n- Taxa de conversão: ${txConv}%\n- Ticket médio: R$${ticket.toLocaleString("pt-BR")}\n- Conversas não lidas: ${msgNaoLidas}\n- Conversão por etapa: ${dropStr}\n\nGere:\n1. DIAGNÓSTICO RÁPIDO (2 linhas)\n2. MAIOR GAP: onde está perdendo mais leads e por quê\n3. TOP 3 AÇÕES para melhorar a conversão\n4. META REALISTA: conversão possível com as ações implementadas\n\nSeja direta, prática e motivadora. Entregue a análise completa e estruturada.`);
  };

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>
      <View style={[S.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[S.backBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[S.headerTitle, { color: colors.text }]}>Análise & KPIs</Text>
          <Text style={[S.headerSub, { color: colors.mutedForeground }]}>Performance e gaps do pipeline</Text>
        </View>
        <View style={[S.enterpriseBadge, { backgroundColor: "#8400FF20", borderColor: "#8400FF44" }]}>
          <Text style={S.enterpriseBadgeText}>ENTERPRISE</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[S.scroll, { paddingBottom: insets.bottom + 100 }]}>
        {/* ── JADE quote ── */}
        <View style={[S.jadeBanner, { backgroundColor: "#FF008012", borderColor: "#FF008030" }]}>
          <Feather name="cpu" size={14} color="#FF0080" />
          <Text style={S.jadeBannerText}>
            {biggestGap && total > 0
              ? `Maior gap detectado: ${biggestGap.from} — ${Math.round(biggestGap.rate * 100)}% de conversão. Vamos resolver isso! 🎯`
              : "Adicione leads ao pipeline para eu analisar seus gaps de conversão."}
          </Text>
        </View>

        {/* ── KPIs ── */}
        <Text style={[S.sectionLabel, { color: colors.mutedForeground }]}>KPIs PRINCIPAIS</Text>
        <View style={S.kpiGrid}>
          <KpiCard
            label="Taxa de Conversão"
            value={`${txConv}%`}
            sub={txConv >= 20 ? "▲ Acima da média" : "▼ Abaixo da média"}
            icon="trending-up"
            color={txConv >= 20 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.5)"}
          />
          <KpiCard
            label="Ticket Médio"
            value={ticket >= 1000 ? `R$${(ticket / 1000).toFixed(1)}k` : `R$${ticket}`}
            sub={`${fechados.length} contratos`}
            icon="dollar-sign"
            color="rgba(255,255,255,0.45)"
          />
          <KpiCard
            label="Leads Ativos"
            value={String(novos + qualif + proposta)}
            sub={`${total} total no pipeline`}
            icon="users"
            color="#FF0080"
          />
          <KpiCard
            label="Conv. Não Lidas"
            value={String(msgNaoLidas)}
            sub={msgNaoLidas > 0 ? "Requer atenção" : "Em dia ✓"}
            icon="message-circle"
            color={msgNaoLidas > 0 ? "#FF0080" : "rgba(255,255,255,0.55)"}
          />
        </View>

        {/* ── Gap Analysis ── */}
        <Text style={[S.sectionLabel, { color: colors.mutedForeground }]}>ANÁLISE DE GAP — FUNIL</Text>
        <View style={[S.gapCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {stages.map((stage) => (
            <GapBar key={stage.label} label={stage.label} count={stage.count} total={total} color={stage.color} />
          ))}

          {total > 0 && (
            <>
              <View style={[S.divider, { backgroundColor: colors.border }]} />
              <Text style={[S.gapTitle, { color: colors.text }]}>Drop-off por etapa</Text>
              {drops.map((d) => (
                <View key={d.from} style={S.dropRow}>
                  <Feather
                    name={d.rate < 0.3 ? "alert-circle" : d.rate < 0.6 ? "alert-triangle" : "check-circle"}
                    size={14}
                    color={d.rate < 0.3 ? "rgba(255,255,255,0.5)" : d.rate < 0.6 ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.55)"}
                  />
                  <Text style={[S.dropLabel, { color: colors.mutedForeground }]}>{d.from}</Text>
                  <Text style={[S.dropRate, {
                    color: d.rate < 0.3 ? "rgba(255,255,255,0.5)" : d.rate < 0.6 ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.55)",
                  }]}>
                    {d.rate > 0 ? `${Math.round(d.rate * 100)}%` : "—"}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* ── JADE Analysis ── */}
        <TouchableOpacity
          style={[S.jadeBtn, (gerando || total === 0) && { opacity: 0.6 }]}
          onPress={gerarAnalise}
          disabled={gerando || total === 0}
          activeOpacity={0.85}
        >
          {gerando
            ? <><ActivityIndicator color="#fff" size="small" /><Text style={S.jadeBtnText}>JADE analisando gaps...</Text></>
            : <><Feather name="cpu" size={17} color="#fff" /><Text style={S.jadeBtnText}>Gerar Análise Completa</Text></>
          }
        </TouchableOpacity>

        {!!jadeError && (
          <View style={[S.errorBox]}>
            <Feather name="alert-circle" size={14} color="#FF6B6B" />
            <Text style={S.errorText}>{jadeError}</Text>
          </View>
        )}

        {!!analise && !gerando && (
          <View style={[S.analiseBox, { backgroundColor: colors.card, borderColor: "#FF008030" }]}>
            <View style={[S.analiseHeader, { backgroundColor: "#FF008012" }]}>
              <Feather name="cpu" size={13} color="#FF0080" />
              <Text style={S.analiseLabel}>Análise da JADE</Text>
            </View>
            <Text style={[S.analiseText, { color: colors.text }]}>{analise}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  root:   { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn:{ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle:{ fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  headerSub:  { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  enterpriseBadge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  enterpriseBadgeText:{ fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", color: "#8400FF" },
  scroll: { padding: 16, gap: 16 },
  jadeBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
  jadeBannerText: { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", color: "#FF8080", lineHeight: 20 },
  sectionLabel: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gapCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 12 },
  gapTitle: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold", marginBottom: 10 },
  dropRow:  { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  dropLabel:{ flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular" },
  dropRate: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", width: 40, textAlign: "right" },
  jadeBtn: {
    backgroundColor: "#FF0080", flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, height: 54, borderRadius: 14,
    shadowColor: "#FF0080", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  jadeBtnText:  { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  analiseBox:   { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  analiseHeader:{ flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  analiseLabel: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold", color: "#FF0080" },
  analiseText:  { fontSize: 16, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 22, padding: 16, paddingTop: 4, color: "#FFFFFF" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, backgroundColor: "#FF6B6B18", borderWidth: 1, borderColor: "#FF6B6B40" },
  errorText: { flex: 1, fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", color: "#FF6B6B", lineHeight: 20 },
});
