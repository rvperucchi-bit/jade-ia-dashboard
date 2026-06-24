import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const PINK   = "#FF0080";
const PURPLE = "#8400FF";

const API_BASE = Platform.OS === "web" ? "" : `https://${process.env.EXPO_PUBLIC_DOMAIN ?? ""}`;

interface ApiVendedor {
  id: string; nome: string; email: string; segmento: string;
  metaMensal: number; metaLeads: number; realizado: number;
  avatarColor: string; ultimaAtividade: string;
}

function vendedorToColaborador(v: ApiVendedor): Colaborador {
  return {
    id: v.id, nome: v.nome, email: v.email,
    cargo: v.segmento || "Executivo Comercial",
    telefone: "",
    dataEntrada: new Date().toLocaleDateString("pt-BR"),
    status: "Ativo",
    permissao: "Executivo",
    meta: v.metaMensal, leads: v.metaLeads,
    oportunidades: 0, vendas: v.realizado,
    ticketMedio: v.realizado > 0 ? Math.round(v.realizado / Math.max(v.metaLeads, 1)) : 0,
    conversao: v.metaMensal > 0 ? Math.round((v.realizado / v.metaMensal) * 100) : 0,
    pipeline: [
      { etapa: "Prospecção",   qtd: Math.ceil(v.metaLeads * 0.4) },
      { etapa: "Qualificação", qtd: Math.ceil(v.metaLeads * 0.3) },
      { etapa: "Proposta",     qtd: Math.ceil(v.metaLeads * 0.2) },
      { etapa: "Fechamento",   qtd: Math.ceil(v.metaLeads * 0.1) },
    ],
    atividades: { ligacoes: 0, whatsapp: 0, reunioes: 0, followups: 0 },
    historico: v.ultimaAtividade ? [{ data: v.ultimaAtividade, texto: "Última atividade registrada." }] : [],
  };
}

type Permissao = "Executivo" | "Gestor" | "Administrador";
type StatusCol = "Ativo" | "Inativo";

interface Colaborador {
  id: string;
  nome: string;
  cargo: string;
  telefone: string;
  email: string;
  dataEntrada: string;
  status: StatusCol;
  permissao: Permissao;
  meta: number;
  leads: number;
  oportunidades: number;
  vendas: number;
  ticketMedio: number;
  conversao: number;
  pipeline: { etapa: string; qtd: number }[];
  atividades: { ligacoes: number; whatsapp: number; reunioes: number; followups: number };
  historico: { data: string; texto: string }[];
}

const MOCK: Colaborador[] = [
  {
    id: "1", nome: "João Silva", cargo: "Executivo Comercial", telefone: "(48) 99123-4567",
    email: "joao@empresa.com", dataEntrada: "03/01/2024", status: "Ativo", permissao: "Executivo",
    meta: 50000, leads: 24, oportunidades: 8, vendas: 42000, ticketMedio: 5250, conversao: 33,
    pipeline: [{ etapa: "Prospecção", qtd: 10 }, { etapa: "Qualificação", qtd: 7 }, { etapa: "Proposta", qtd: 5 }, { etapa: "Fechamento", qtd: 2 }],
    atividades: { ligacoes: 42, whatsapp: 87, reunioes: 6, followups: 19 },
    historico: [
      { data: "24/06/2026", texto: "Fechou contrato com Construtora ABC — R$ 12.000" },
      { data: "22/06/2026", texto: "Reunião com cliente Plennus Construção" },
      { data: "18/06/2026", texto: "Proposta enviada para 3 leads qualificados" },
    ],
  },
  {
    id: "2", nome: "Ana Carvalho", cargo: "Gestora Comercial", telefone: "(48) 99234-5678",
    email: "ana@empresa.com", dataEntrada: "15/03/2023", status: "Ativo", permissao: "Gestor",
    meta: 80000, leads: 31, oportunidades: 12, vendas: 74500, ticketMedio: 6208, conversao: 39,
    pipeline: [{ etapa: "Prospecção", qtd: 12 }, { etapa: "Qualificação", qtd: 9 }, { etapa: "Proposta", qtd: 7 }, { etapa: "Fechamento", qtd: 3 }],
    atividades: { ligacoes: 58, whatsapp: 103, reunioes: 11, followups: 27 },
    historico: [
      { data: "24/06/2026", texto: "Meta mensal atingida com 93%" },
      { data: "20/06/2026", texto: "Onboarding de 2 novos leads do radar" },
    ],
  },
  {
    id: "3", nome: "Carlos Mendes", cargo: "Executivo Comercial", telefone: "(48) 99345-6789",
    email: "carlos@empresa.com", dataEntrada: "07/07/2024", status: "Inativo", permissao: "Executivo",
    meta: 40000, leads: 9, oportunidades: 2, vendas: 11000, ticketMedio: 5500, conversao: 22,
    pipeline: [{ etapa: "Prospecção", qtd: 5 }, { etapa: "Qualificação", qtd: 3 }, { etapa: "Proposta", qtd: 1 }, { etapa: "Fechamento", qtd: 0 }],
    atividades: { ligacoes: 14, whatsapp: 23, reunioes: 1, followups: 5 },
    historico: [
      { data: "10/06/2026", texto: "Licença médica iniciada" },
    ],
  },
];

type TabPerfil = "Dados" | "Desempenho" | "Pipeline" | "Atividades" | "Histórico";

function initNovoForm() {
  return { nome: "", cargo: "", email: "", telefone: "", meta: "", permissao: "Executivo" as Permissao };
}

export default function MeuTimeScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const topPad  = Platform.OS === "web" ? 67 : insets.top;
  const botPad  = Platform.OS === "web" ? 84 : insets.bottom + 60;

  const [colaboradores, setColaboradores] = useState<Colaborador[]>(MOCK);
  const [perfilOpen,    setPerfilOpen]    = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/time`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.vendedores) && data.vendedores.length > 0) {
          setColaboradores(data.vendedores.map(vendedorToColaborador));
        }
      })
      .catch(() => {});
  }, []);
  const [selecionado,   setSelecionado]   = useState<Colaborador | null>(null);
  const [tabPerfil,     setTabPerfil]     = useState<TabPerfil>("Dados");
  const [novoOpen,      setNovoOpen]      = useState(false);
  const [form,          setForm]          = useState(initNovoForm());

  const ativos   = colaboradores.filter((c) => c.status === "Ativo").length;
  const vendas   = colaboradores.reduce((s, c) => s + c.vendas, 0);
  const leadsT   = colaboradores.reduce((s, c) => s + c.leads, 0);
  const metaT    = colaboradores.reduce((s, c) => s + c.meta, 0);
  const metaPct  = metaT > 0 ? Math.round((vendas / metaT) * 100) : 0;

  const abrirPerfil = (c: Colaborador) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelecionado(c);
    setTabPerfil("Dados");
    setPerfilOpen(true);
  };

  const salvarNovo = () => {
    if (!form.nome.trim() || !form.cargo.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const novo: Colaborador = {
      id: Date.now().toString(), nome: form.nome.trim(), cargo: form.cargo.trim(),
      telefone: form.telefone, email: form.email, dataEntrada: new Date().toLocaleDateString("pt-BR"),
      status: "Ativo", permissao: form.permissao,
      meta: Number(form.meta) || 0, leads: 0, oportunidades: 0, vendas: 0,
      ticketMedio: 0, conversao: 0,
      pipeline: [{ etapa: "Prospecção", qtd: 0 }, { etapa: "Qualificação", qtd: 0 }, { etapa: "Proposta", qtd: 0 }, { etapa: "Fechamento", qtd: 0 }],
      atividades: { ligacoes: 0, whatsapp: 0, reunioes: 0, followups: 0 },
      historico: [],
    };
    setColaboradores((p) => [novo, ...p]);
    fetch(`${API_BASE}/api/time`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendedor: {
          id: novo.id, nome: novo.nome, email: novo.email,
          segmento: novo.cargo, metaMensal: novo.meta, metaLeads: novo.leads,
          realizado: 0, avatarColor: "#FF0080", ultimaAtividade: "Agora",
        },
      }),
    }).catch(() => {});
    setForm(initNovoForm());
    setNovoOpen(false);
  };

  const initials = (n: string) => n.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

  return (
    <View style={[S.root, { backgroundColor: colors.background }]}>

      {/* ── Cabeçalho ── */}
      <View style={[S.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[S.headerTitle, { color: colors.text }]}>Meu Time</Text>
          <Text style={[S.headerSub, { color: colors.mutedForeground }]}>Acompanhe sua equipe comercial.</Text>
        </View>
        <TouchableOpacity
          style={[S.novoBtn, { backgroundColor: PINK + "18", borderColor: PINK + "44" }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setNovoOpen(true); }}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={14} color={PINK} />
          <Text style={[S.novoBtnText, { color: PINK }]}>Novo Colaborador</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: botPad }}>

        {/* ── Resumo ── */}
        <View style={S.resumoRow}>
          {[
            { label: "Colaboradores", value: String(colaboradores.length), icon: "users" },
            { label: "Leads Ativos",  value: String(leadsT),              icon: "target" },
            { label: "Vendas Mês",    value: `R$${(vendas / 1000).toFixed(0)}k`, icon: "trending-up" },
            { label: "Meta Atingida", value: `${metaPct}%`,               icon: "award" },
          ].map((item) => (
            <View key={item.label} style={[S.resumoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name={item.icon as any} size={14} color={PINK} />
              <Text style={[S.resumoVal, { color: colors.text }]}>{item.value}</Text>
              <Text style={[S.resumoLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Lista de colaboradores ── */}
        <Text style={[S.sectionLabel, { color: colors.mutedForeground }]}>EQUIPE · {ativos} ativo{ativos !== 1 ? "s" : ""}</Text>

        <View style={{ paddingHorizontal: 14, gap: 10 }}>
          {colaboradores.map((c) => {
            const pct = c.meta > 0 ? Math.round((c.vendas / c.meta) * 100) : 0;
            return (
              <TouchableOpacity
                key={c.id}
                style={[S.colCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => abrirPerfil(c)}
                activeOpacity={0.85}
              >
                <View style={S.colTop}>
                  <View style={[S.avatar, { backgroundColor: c.status === "Ativo" ? PINK + "22" : colors.surface }]}>
                    <Text style={[S.avatarText, { color: c.status === "Ativo" ? PINK : colors.mutedForeground }]}>
                      {initials(c.nome)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={S.colNameRow}>
                      <Text style={[S.colNome, { color: colors.text }]}>{c.nome}</Text>
                      <View style={[S.statusBadge, {
                        backgroundColor: c.status === "Ativo" ? "#22c55e18" : colors.surface,
                        borderColor: c.status === "Ativo" ? "#22c55e44" : colors.border,
                      }]}>
                        <Text style={[S.statusText, { color: c.status === "Ativo" ? "#22c55e" : colors.mutedForeground }]}>
                          {c.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={[S.colCargo, { color: colors.mutedForeground }]}>{c.cargo}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </View>

                <View style={[S.colDivider, { backgroundColor: colors.border }]} />

                <View style={S.colMetrics}>
                  {[
                    { label: "Leads",        value: String(c.leads) },
                    { label: "Oport.",       value: String(c.oportunidades) },
                    { label: "Vendas",       value: `R$${(c.vendas / 1000).toFixed(0)}k` },
                    { label: "Meta",         value: `${pct}%` },
                  ].map((m) => (
                    <View key={m.label} style={S.colMetricItem}>
                      <Text style={[S.colMetricVal, { color: colors.text }]}>{m.value}</Text>
                      <Text style={[S.colMetricLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* ─────────────── MODAL PERFIL ─────────────── */}
      <Modal visible={perfilOpen} animationType="slide" transparent onRequestClose={() => setPerfilOpen(false)}>
        <View style={S.modalOverlay}>
          <View style={[S.perfilSheet, { backgroundColor: colors.background }]}>
            {selecionado && (
              <>
                {/* Perfil header */}
                <View style={[S.perfilHeader, { borderBottomColor: colors.border }]}>
                  <View style={[S.avatarLg, { backgroundColor: PINK + "22" }]}>
                    <Text style={[S.avatarLgText, { color: PINK }]}>{initials(selecionado.nome)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.perfilNome, { color: colors.text }]}>{selecionado.nome}</Text>
                    <Text style={[S.perfilCargo, { color: colors.mutedForeground }]}>{selecionado.cargo}</Text>
                    <View style={[S.permBadge, { backgroundColor: PURPLE + "18", borderColor: PURPLE + "44" }]}>
                      <Text style={[S.permText, { color: PURPLE }]}>{selecionado.permissao}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setPerfilOpen(false)} style={S.closeBtn} activeOpacity={0.7}>
                    <Feather name="x" size={22} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>

                {/* Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={S.tabBar} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                  {(["Dados", "Desempenho", "Pipeline", "Atividades", "Histórico"] as TabPerfil[]).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[S.tabBtn, { borderColor: tabPerfil === t ? PINK : colors.border, backgroundColor: tabPerfil === t ? PINK + "12" : "transparent" }]}
                      onPress={() => { Haptics.selectionAsync(); setTabPerfil(t); }}
                      activeOpacity={0.8}
                    >
                      <Text style={[S.tabText, { color: tabPerfil === t ? PINK : colors.mutedForeground }]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Conteúdo da aba */}
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 12 }}>

                  {tabPerfil === "Dados" && (
                    <>
                      {[
                        { label: "Nome",          value: selecionado.nome },
                        { label: "Cargo",         value: selecionado.cargo },
                        { label: "Telefone",      value: selecionado.telefone },
                        { label: "E-mail",        value: selecionado.email },
                        { label: "Data de Entrada", value: selecionado.dataEntrada },
                        { label: "Permissão",     value: selecionado.permissao },
                        { label: "Status",        value: selecionado.status },
                      ].map((row) => (
                        <View key={row.label} style={[S.dadosRow, { borderBottomColor: colors.border }]}>
                          <Text style={[S.dadosLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                          <Text style={[S.dadosVal, { color: colors.text }]}>{row.value}</Text>
                        </View>
                      ))}
                    </>
                  )}

                  {tabPerfil === "Desempenho" && (
                    <View style={{ gap: 10 }}>
                      {[
                        { label: "Leads",        value: String(selecionado.leads),                     icon: "target" },
                        { label: "Oportunidades", value: String(selecionado.oportunidades),            icon: "briefcase" },
                        { label: "Conversão",    value: `${selecionado.conversao}%`,                   icon: "percent" },
                        { label: "Vendas",       value: `R$ ${selecionado.vendas.toLocaleString("pt-BR")}`, icon: "dollar-sign" },
                        { label: "Ticket Médio", value: `R$ ${selecionado.ticketMedio.toLocaleString("pt-BR")}`, icon: "bar-chart-2" },
                        { label: "Meta Mensal",  value: `R$ ${selecionado.meta.toLocaleString("pt-BR")}`, icon: "award" },
                      ].map((item) => (
                        <View key={item.label} style={[S.desempRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                          <View style={[S.desempIcon, { backgroundColor: PINK + "14" }]}>
                            <Feather name={item.icon as any} size={16} color={PINK} />
                          </View>
                          <Text style={[S.desempLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                          <Text style={[S.desempVal, { color: colors.text }]}>{item.value}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {tabPerfil === "Pipeline" && (
                    <View style={{ gap: 10 }}>
                      {selecionado.pipeline.map((etapa) => {
                        const maxQ = Math.max(...selecionado.pipeline.map((e) => e.qtd), 1);
                        const pct  = Math.round((etapa.qtd / maxQ) * 100);
                        return (
                          <View key={etapa.etapa} style={[S.pipeRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <View style={S.pipeTop}>
                              <Text style={[S.pipeEtapa, { color: colors.text }]}>{etapa.etapa}</Text>
                              <Text style={[S.pipeQtd, { color: PINK }]}>{etapa.qtd}</Text>
                            </View>
                            <View style={[S.pipeTrack, { backgroundColor: colors.surface }]}>
                              <View style={[S.pipeFill, { width: `${pct}%` as any, backgroundColor: PINK }]} />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}

                  {tabPerfil === "Atividades" && (
                    <View style={{ gap: 10 }}>
                      {[
                        { label: "Ligações",   value: selecionado.atividades.ligacoes,  icon: "phone" },
                        { label: "WhatsApp",   value: selecionado.atividades.whatsapp,  icon: "message-circle" },
                        { label: "Reuniões",   value: selecionado.atividades.reunioes,  icon: "calendar" },
                        { label: "Follow-ups", value: selecionado.atividades.followups, icon: "repeat" },
                      ].map((item) => (
                        <View key={item.label} style={[S.desempRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                          <View style={[S.desempIcon, { backgroundColor: PURPLE + "14" }]}>
                            <Feather name={item.icon as any} size={16} color={PURPLE} />
                          </View>
                          <Text style={[S.desempLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
                          <Text style={[S.desempVal, { color: colors.text }]}>{item.value}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {tabPerfil === "Histórico" && (
                    <View style={{ gap: 12 }}>
                      {selecionado.historico.length === 0 && (
                        <Text style={[S.emptyText, { color: colors.mutedForeground }]}>Nenhum evento registrado.</Text>
                      )}
                      {selecionado.historico.map((ev, i) => (
                        <View key={i} style={S.histItem}>
                          <View style={[S.histDot, { backgroundColor: PINK }]} />
                          <View style={{ flex: 1 }}>
                            <Text style={[S.histTexto, { color: colors.text }]}>{ev.texto}</Text>
                            <Text style={[S.histData, { color: colors.mutedForeground }]}>{ev.data}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ─────────────── MODAL NOVO COLABORADOR ─────────────── */}
      <Modal visible={novoOpen} animationType="slide" transparent onRequestClose={() => setNovoOpen(false)}>
        <View style={S.modalOverlay}>
          <View style={[S.novoSheet, { backgroundColor: colors.card }]}>
            <View style={[S.novoHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[S.novoTitle, { color: colors.text }]}>Novo Colaborador</Text>
                <Text style={[S.novoSub, { color: colors.mutedForeground }]}>Preencha os dados do colaborador</Text>
              </View>
              <TouchableOpacity onPress={() => setNovoOpen(false)} activeOpacity={0.7}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 14 }}>
              {([
                { key: "nome",      label: "Nome",         placeholder: "João Silva",            keyboard: "default" },
                { key: "cargo",     label: "Cargo",        placeholder: "Executivo Comercial",   keyboard: "default" },
                { key: "email",     label: "E-mail",       placeholder: "joao@empresa.com",      keyboard: "email-address" },
                { key: "telefone",  label: "Telefone",     placeholder: "(48) 99999-9999",       keyboard: "phone-pad" },
                { key: "meta",      label: "Meta Mensal (R$)", placeholder: "50000",             keyboard: "numeric" },
              ] as { key: keyof typeof form; label: string; placeholder: string; keyboard: any }[]).map((f) => (
                <View key={f.key} style={{ gap: 6 }}>
                  <Text style={[S.fieldLabel, { color: colors.mutedForeground }]}>{f.label.toUpperCase()}</Text>
                  <View style={[S.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <TextInput
                      style={[S.input, { color: colors.text }]}
                      placeholder={f.placeholder}
                      placeholderTextColor={colors.mutedForeground}
                      value={form[f.key]}
                      onChangeText={(v) => setForm((p) => ({ ...p, [f.key]: v }))}
                      keyboardType={f.keyboard}
                      autoCapitalize={f.keyboard === "default" ? "words" : "none"}
                    />
                  </View>
                </View>
              ))}

              <View style={{ gap: 6 }}>
                <Text style={[S.fieldLabel, { color: colors.mutedForeground }]}>PERMISSÃO</Text>
                <View style={S.permRow}>
                  {(["Executivo", "Gestor", "Administrador"] as Permissao[]).map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[S.permOpt, {
                        borderColor: form.permissao === p ? PURPLE : colors.border,
                        backgroundColor: form.permissao === p ? PURPLE + "18" : colors.surface,
                      }]}
                      onPress={() => { Haptics.selectionAsync(); setForm((prev) => ({ ...prev, permissao: p })); }}
                      activeOpacity={0.8}
                    >
                      <Text style={[S.permOptText, { color: form.permissao === p ? PURPLE : colors.mutedForeground }]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[S.salvarBtn, { backgroundColor: PINK }, (!form.nome.trim() || !form.cargo.trim()) && { opacity: 0.45 }]}
                onPress={salvarNovo}
                activeOpacity={0.85}
                disabled={!form.nome.trim() || !form.cargo.trim()}
              >
                <Feather name="user-plus" size={16} color="#fff" />
                <Text style={S.salvarBtnText}>Adicionar ao Time</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1 },

  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 18, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },
  novoBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  novoBtnText: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },

  resumoRow: { flexDirection: "row", paddingHorizontal: 14, paddingTop: 16, paddingBottom: 6, gap: 8 },
  resumoCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 10, alignItems: "center", gap: 4 },
  resumoVal: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  resumoLabel: { fontSize: 9, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center" },

  sectionLabel: { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1.2, marginHorizontal: 18, marginTop: 14, marginBottom: 10 },

  colCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  colTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  colNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  colNome: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  statusText: { fontSize: 10, fontFamily: "SpaceGrotesk_600SemiBold" },
  colCargo: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  colDivider: { height: StyleSheet.hairlineWidth },
  colMetrics: { flexDirection: "row", justifyContent: "space-between" },
  colMetricItem: { alignItems: "center", gap: 2 },
  colMetricVal: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  colMetricLabel: { fontSize: 10, fontFamily: "SpaceGrotesk_400Regular" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "flex-end" },

  perfilSheet: { height: "92%", borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden" },
  perfilHeader: { flexDirection: "row", alignItems: "flex-start", gap: 14, padding: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  avatarLg: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  avatarLgText: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  perfilNome: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  perfilCargo: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },
  permBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7, borderWidth: 1, marginTop: 5 },
  permText: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold" },
  closeBtn: { padding: 4 },

  tabBar: { maxHeight: 50, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.06)" },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, marginVertical: 8 },
  tabText: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },

  dadosRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  dadosLabel: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular" },
  dadosVal: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold", maxWidth: "60%", textAlign: "right" },

  desempRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  desempIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  desempLabel: { flex: 1, fontSize: 14, fontFamily: "SpaceGrotesk_400Regular" },
  desempVal: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },

  pipeRow: { padding: 14, borderRadius: 12, borderWidth: 1, gap: 8 },
  pipeTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pipeEtapa: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  pipeQtd: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  pipeTrack: { height: 5, borderRadius: 3, overflow: "hidden" },
  pipeFill: { position: "absolute", top: 0, left: 0, bottom: 0, borderRadius: 3 },

  histItem: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  histDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  histTexto: { fontSize: 14, fontFamily: "SpaceGrotesk_500Medium", lineHeight: 20 },
  histData: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },

  emptyText: { fontSize: 14, fontFamily: "SpaceGrotesk_400Regular", textAlign: "center", paddingVertical: 24 },

  novoSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "88%", overflow: "hidden" },
  novoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 22, borderBottomWidth: StyleSheet.hairlineWidth },
  novoTitle: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  novoSub: { fontSize: 13, fontFamily: "SpaceGrotesk_400Regular", marginTop: 2 },

  fieldLabel: { fontSize: 10, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 0.8 },
  inputWrap: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, height: 48, justifyContent: "center" },
  input: { fontSize: 15, fontFamily: "SpaceGrotesk_400Regular" },

  permRow: { flexDirection: "row", gap: 8 },
  permOpt: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  permOptText: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },

  salvarBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52, borderRadius: 14, marginTop: 8 },
  salvarBtnText: { color: "#fff", fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
});
