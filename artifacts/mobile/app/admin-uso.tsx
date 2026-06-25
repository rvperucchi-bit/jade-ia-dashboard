import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useColors } from "@/hooks/useColors";

const PINK   = "#FF0080";
const PURPLE = "#8400FF";

const API_BASE =
  Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

type PlanKey = "start" | "pro" | "enterprise";

interface OperationReport {
  used:      number;
  limit:     number;
  pct_used:  number;
  cost_usd:  number;
}

interface ReportAlert {
  operation: string;
  pct_used:  number;
  level:     "80" | "90" | "100";
}

interface UsageReport {
  company_id:    string;
  plan:          PlanKey;
  plan_label:    string;
  year_month:    string;
  operations:    Record<string, OperationReport>;
  roi: {
    revenue_brl:     number;
    cost_low_brl:    number;
    cost_high_brl:   number;
    profit_low_brl:  number;
    profit_high_brl: number;
    margin_low_pct:  number;
    margin_high_pct: number;
  };
  alerts:        ReportAlert[];
  total_cost_usd: number;
}

// ─── Operation config ─────────────────────────────────────────────────────────
const OP_CONFIG: Record<string, { label: string; sub: string; icon: string; color: string }> = {
  chat:              { label: "Chat IA",           sub: "Mensagens enviadas",      icon: "message-circle", color: PINK },
  radar:             { label: "Radar de Leads",    sub: "Buscas de prospecção",    icon: "radio",          color: PURPLE },
  audio:             { label: "Áudio",             sub: "Transcrições (minutos)",  icon: "mic",            color: "#00A8FF" },
  image_generation:  { label: "Imagens IA",        sub: "Imagens geradas",         icon: "image",          color: "#FF6B00" },
  vision:            { label: "Visão",             sub: "Análise de imagens",      icon: "eye",            color: "#00D68F" },
  document_analysis: { label: "Documentos",        sub: "Arquivos analisados",     icon: "file-text",      color: "#FFB300" },
};

const OP_ORDER = ["chat", "radar", "audio", "image_generation", "vision", "document_analysis"];

// ─── Plan config ──────────────────────────────────────────────────────────────
const PLAN_CONFIG: Record<PlanKey, { color: string; label: string }> = {
  start:      { color: PINK,    label: "Start" },
  pro:        { color: PURPLE,  label: "Pro" },
  enterprise: { color: "#FFB300", label: "Enterprise" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function barColor(pct: number): string {
  if (pct >= 100) return "#CC2244";
  if (pct >= 90)  return "#FF4400";
  if (pct >= 80)  return "#FF8800";
  return PINK;
}

function alertColor(level: string): string {
  if (level === "100") return "#CC2244";
  if (level === "90")  return "#FF4400";
  return "#FF8800";
}

function fmtBrl(n: number): string {
  return "R$ " + n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function fmtUsd(n: number): string {
  return "US$ " + n.toFixed(4);
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function UsageBar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={S.barTrack}>
      <View
        style={[
          S.barFill,
          { width: `${Math.min(pct, 100)}%` as any, backgroundColor: color },
        ]}
      />
    </View>
  );
}

function SectionTitle({ label }: { label: string }) {
  const colors = useColors();
  return (
    <Text style={[S.sectionTitle, { color: colors.mutedForeground }]}>{label}</Text>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AdminUsoScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();

  const [report,      setReport]      = useState<UsageReport | null>(null);
  const [company,     setCompany]     = useState<string>("");
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [planModal,   setPlanModal]   = useState(false);
  const [settingPlan, setSettingPlan] = useState(false);

  const topPad = Platform.OS === "web" ? 24 : insets.top + 4;
  const botPad = Platform.OS === "web" ? 40 : insets.bottom + 32;

  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/usage-current`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 404) {
          Alert.alert(
            "Empresa não configurada",
            "Configure a empresa em Configurações → Minha Empresa primeiro.",
            [{ text: "OK", onPress: () => router.back() }]
          );
          return;
        }
        throw new Error((err as any).error ?? "Erro ao carregar uso");
      }
      const json = await res.json();
      setReport(json.report as UsageReport);
      setCompany(json.company as string ?? "");
    } catch (e: any) {
      Alert.alert("Erro", e.message ?? "Não foi possível carregar os dados.");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchReport().finally(() => setLoading(false));
  }, [fetchReport]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReport();
    setRefreshing(false);
  }, [fetchReport]);

  const handleSetPlan = useCallback(async (plan: PlanKey) => {
    if (!company) return;
    setSettingPlan(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/usage/${encodeURIComponent(company)}/plan`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan }),
        }
      );
      if (!res.ok) throw new Error("Falha ao atualizar plano");
      setPlanModal(false);
      setLoading(true);
      await fetchReport();
    } catch (e: any) {
      Alert.alert("Erro", e.message);
    } finally {
      setSettingPlan(false);
      setLoading(false);
    }
  }, [company, fetchReport]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading && !report) {
    return (
      <View style={[S.root, { backgroundColor: colors.background }]}>
        <View style={[S.header, { paddingTop: topPad }]}>
          <TouchableOpacity onPress={() => router.back()} style={S.backBtn} activeOpacity={0.7}>
            <Feather name="chevron-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[S.headerTitle, { color: colors.text }]}>Admin · Uso</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={S.center}>
          <ActivityIndicator color={PINK} size="large" />
          <Text style={[S.loadingText, { color: colors.mutedForeground }]}>Carregando dados...</Text>
        </View>
      </View>
    );
  }

  if (!report) return null;

  const plan   = report.plan;
  const planCfg = PLAN_CONFIG[plan] ?? PLAN_CONFIG.start;

  return (
    <>
      <ScrollView
        style={[S.root, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: botPad }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PINK}
            colors={[PINK]}
          />
        }
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <View style={[S.header, { paddingTop: topPad }]}>
          <TouchableOpacity onPress={() => router.back()} style={S.backBtn} activeOpacity={0.7}>
            <Feather name="chevron-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            <Text style={[S.headerTitle, { color: colors.text }]}>Admin · Uso</Text>
            {company ? (
              <Text style={[S.headerSub, { color: colors.mutedForeground }]}>{company}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            style={S.refreshBtn}
            onPress={onRefresh}
            activeOpacity={0.7}
            disabled={refreshing}
          >
            <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 16, gap: 12 }}>

          {/* ── Alerts ────────────────────────────────────────────────────── */}
          {report.alerts.length > 0 && (
            <View style={[S.alertsBox, { backgroundColor: "#CC220014", borderColor: "#CC220040" }]}>
              <View style={S.alertsRow}>
                <Feather name="alert-triangle" size={14} color="#FF4400" />
                <Text style={[S.alertsTitle, { color: "#FF4400" }]}>
                  {report.alerts.length === 1 ? "1 alerta de limite" : `${report.alerts.length} alertas de limite`}
                </Text>
              </View>
              {report.alerts.map((a, i) => {
                const opCfg = OP_CONFIG[a.operation];
                const col = alertColor(a.level);
                return (
                  <View key={i} style={S.alertItem}>
                    <View style={[S.alertDot, { backgroundColor: col }]} />
                    <Text style={[S.alertText, { color: col }]}>
                      {opCfg?.label ?? a.operation} — {a.pct_used.toFixed(0)}% usado
                      {a.level === "100" ? " (ESGOTADO)" : a.level === "90" ? " (crítico)" : " (atenção)"}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── Plano atual ───────────────────────────────────────────────── */}
          <SectionTitle label="PLANO ATUAL" />
          <View style={[S.planCard, { backgroundColor: planCfg.color + "14", borderColor: planCfg.color + "40" }]}>
            <MaterialCommunityIcons name="crown" size={18} color={planCfg.color} />
            <View style={{ flex: 1 }}>
              <Text style={[S.planLabel, { color: planCfg.color }]}>Plano {planCfg.label}</Text>
              <Text style={[S.planSub, { color: colors.mutedForeground }]}>
                {report.year_month} · {company}
              </Text>
            </View>
            <TouchableOpacity
              style={[S.changePlanBtn, { borderColor: planCfg.color + "55" }]}
              onPress={() => setPlanModal(true)}
              activeOpacity={0.8}
            >
              <Text style={[S.changePlanText, { color: planCfg.color }]}>Alterar</Text>
            </TouchableOpacity>
          </View>

          {/* ── Custo total ───────────────────────────────────────────────── */}
          <View style={[S.costCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={S.costRow}>
              <View style={[S.costIcon, { backgroundColor: PINK + "1A" }]}>
                <Feather name="dollar-sign" size={14} color={PINK} />
              </View>
              <Text style={[S.costLabel, { color: colors.mutedForeground }]}>Custo OpenAI este mês</Text>
              <Text style={[S.costValue, { color: colors.text }]}>{fmtUsd(report.total_cost_usd)}</Text>
            </View>
          </View>

          {/* ── Operações ─────────────────────────────────────────────────── */}
          <SectionTitle label="CONSUMO POR OPERAÇÃO" />
          {OP_ORDER.map((opKey) => {
            const op  = report.operations[opKey];
            if (!op) return null;
            const cfg = OP_CONFIG[opKey] ?? { label: opKey, sub: "", icon: "activity", color: PINK };
            const pct = Math.min(op.pct_used, 100);
            const col = barColor(op.pct_used);

            return (
              <View
                key={opKey}
                style={[S.opCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={S.opHead}>
                  <View style={[S.opIcon, { backgroundColor: cfg.color + "1A" }]}>
                    <Feather name={cfg.icon as any} size={15} color={cfg.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.opTitle, { color: colors.text }]}>{cfg.label}</Text>
                    <Text style={[S.opSub,   { color: colors.mutedForeground }]}>{cfg.sub}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[S.opUsed, { color: colors.text }]}>
                      {op.used.toLocaleString("pt-BR")}
                      <Text style={[S.opLimit, { color: colors.mutedForeground }]}>
                        {" "}/{op.limit === Infinity ? "∞" : op.limit.toLocaleString("pt-BR")}
                      </Text>
                    </Text>
                    <Text style={[S.opPct, { color: col }]}>{pct.toFixed(0)}%</Text>
                  </View>
                </View>
                <UsageBar pct={pct} color={col} />
                <Text style={[S.opCost, { color: colors.mutedForeground }]}>
                  Custo: {fmtUsd(op.cost_usd)}
                </Text>
              </View>
            );
          })}

          {/* ── ROI ───────────────────────────────────────────────────────── */}
          <SectionTitle label="RETORNO SOBRE INVESTIMENTO" />
          <View style={[S.roiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <RoiRow
              label="Receita do plano"
              value={fmtBrl(report.roi.revenue_brl)}
              colors={colors}
              icon="trending-up"
              iconColor={PINK}
            />
            <View style={[S.roiDivider, { backgroundColor: colors.border }]} />
            <RoiRow
              label="Custo estimado"
              value={`${fmtBrl(report.roi.cost_low_brl)} – ${fmtBrl(report.roi.cost_high_brl)}`}
              colors={colors}
              icon="cpu"
              iconColor={PURPLE}
            />
            <View style={[S.roiDivider, { backgroundColor: colors.border }]} />
            <RoiRow
              label="Lucro estimado"
              value={`${fmtBrl(report.roi.profit_low_brl)} – ${fmtBrl(report.roi.profit_high_brl)}`}
              colors={colors}
              icon="dollar-sign"
              iconColor="#00D68F"
            />
            <View style={[S.roiDivider, { backgroundColor: colors.border }]} />
            <RoiRow
              label="Margem estimada"
              value={`${report.roi.margin_low_pct.toFixed(1)}% – ${report.roi.margin_high_pct.toFixed(1)}%`}
              colors={colors}
              icon="percent"
              iconColor="#FFB300"
            />
          </View>

          {/* ── Nota ──────────────────────────────────────────────────────── */}
          <View style={[S.noteCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="info" size={13} color={colors.mutedForeground} />
            <Text style={[S.noteText, { color: colors.mutedForeground }]}>
              Custo OpenAI estimado com base no uso real. Custos reais podem variar conforme o
              modelo e tokens processados. ROI calculado sobre receita bruta do plano.
            </Text>
          </View>

        </View>
      </ScrollView>

      {/* ── Modal: alterar plano ─────────────────────────────────────────────── */}
      {planModal && (
        <View style={S.modalOverlay}>
          <View style={[S.modalBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[S.modalTitle, { color: colors.text }]}>Alterar Plano</Text>
            <Text style={[S.modalSub,   { color: colors.mutedForeground }]}>
              Selecione o plano para {company}
            </Text>

            {(["start", "pro", "enterprise"] as PlanKey[]).map((p) => {
              const pc    = PLAN_CONFIG[p];
              const isCur = p === plan;
              return (
                <TouchableOpacity
                  key={p}
                  style={[
                    S.planOption,
                    { borderColor: isCur ? pc.color + "88" : colors.border },
                    isCur && { backgroundColor: pc.color + "12" },
                  ]}
                  onPress={() => handleSetPlan(p)}
                  activeOpacity={0.8}
                  disabled={settingPlan || isCur}
                >
                  <View style={[S.planOptionDot, { backgroundColor: pc.color }]} />
                  <Text style={[S.planOptionLabel, { color: isCur ? pc.color : colors.text }]}>
                    Plano {pc.label}
                  </Text>
                  {isCur && (
                    <Text style={[S.planOptionCurrent, { color: pc.color }]}>atual</Text>
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[S.cancelBtn, { borderColor: colors.border }]}
              onPress={() => setPlanModal(false)}
              activeOpacity={0.7}
              disabled={settingPlan}
            >
              {settingPlan
                ? <ActivityIndicator color={colors.mutedForeground} size="small" />
                : <Text style={[S.cancelText, { color: colors.mutedForeground }]}>Cancelar</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}

// ─── ROI row component ────────────────────────────────────────────────────────
function RoiRow({
  label, value, colors, icon, iconColor,
}: {
  label: string; value: string; colors: any; icon: string; iconColor: string;
}) {
  return (
    <View style={S.roiRow}>
      <View style={[S.roiIcon, { backgroundColor: iconColor + "1A" }]}>
        <Feather name={icon as any} size={13} color={iconColor} />
      </View>
      <Text style={[S.roiLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[S.roiValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular" },

  header:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16 },
  backBtn:   { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  refreshBtn:{ width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle:{ fontSize: 17, fontFamily: "SpaceGrotesk_700Bold" },
  headerSub:  { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },

  sectionTitle: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 0.8, marginTop: 4 },

  alertsBox:   { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  alertsRow:   { flexDirection: "row", alignItems: "center", gap: 8 },
  alertsTitle: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  alertItem:   { flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 4 },
  alertDot:    { width: 6, height: 6, borderRadius: 3 },
  alertText:   { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", flex: 1 },

  planCard:      { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, borderWidth: 1, padding: 14 },
  planLabel:     { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  planSub:       { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  changePlanBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  changePlanText:{ fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },

  costCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  costRow:  { flexDirection: "row", alignItems: "center", gap: 10 },
  costIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  costLabel:{ flex: 1, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" },
  costValue:{ fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },

  opCard:  { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  opHead:  { flexDirection: "row", alignItems: "center", gap: 10 },
  opIcon:  { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  opTitle: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  opSub:   { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },
  opUsed:  { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  opLimit: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular" },
  opPct:   { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold", marginTop: 1 },
  opCost:  { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },

  barTrack: { height: 4, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" },
  barFill:  { height: 4, borderRadius: 2 },

  roiCard:    { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  roiRow:     { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 13 },
  roiIcon:    { width: 28, height: 28, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  roiLabel:   { flex: 1, fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" },
  roiValue:   { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
  roiDivider: { height: StyleSheet.hairlineWidth, marginLeft: 52 },

  noteCard: { borderRadius: 12, borderWidth: 1, padding: 12, flexDirection: "row", gap: 10 },
  noteText: { flex: 1, fontSize: 11, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 17 },

  modalOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.75)", alignItems: "center", justifyContent: "flex-end", zIndex: 999 },
  modalBox:     { width: "100%", borderRadius: 20, borderWidth: 1, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 24, gap: 10 },
  modalTitle:   { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  modalSub:     { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginBottom: 6 },
  planOption:   { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 12, padding: 14 },
  planOptionDot:{ width: 8, height: 8, borderRadius: 4 },
  planOptionLabel: { flex: 1, fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  planOptionCurrent: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },
  cancelBtn:    { borderWidth: 1, borderRadius: 12, padding: 14, alignItems: "center", marginTop: 4 },
  cancelText:   { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
});
