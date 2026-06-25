import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useApp, ConversationMessage } from "@/context/AppContext";

export default function ConversaDetail() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { conversations } = useApp();

  const conversation = conversations.find((c) => c.id === id);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [messages, setMessages] = useState<ConversationMessage[]>(
    conversation?.messages ?? []
  );
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newMsg: ConversationMessage = {
      id: Date.now().toString(),
      text: input.trim(),
      sender: "me",
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      read: false,
    };
    setMessages((prev) => [newMsg, ...prev]);
    setInput("");
  };

  if (!conversation) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>
            Conversa não encontrada
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 10,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={[styles.avatar, { backgroundColor: conversation.avatarColor }]}>
          <Text style={styles.avatarText}>{conversation.initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerName, { color: colors.text }]}>{conversation.contactName}</Text>
          <Text style={[styles.headerStatus, { color: conversation.isOnline ? colors.success : colors.mutedForeground }]}>
            {conversation.isOnline ? "Online agora" : "Offline"}
          </Text>
        </View>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
          <Feather name="phone" size={18} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
          <Feather name="more-vertical" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        inverted
        initialNumToRender={15}
        maxToRenderPerBatch={8}
        windowSize={8}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.msgList}
        renderItem={({ item }) => {
          const isMe = item.sender === "me";
          return (
            <View style={[styles.msgRow, isMe ? styles.msgRight : styles.msgLeft]}>
              <View
                style={[
                  styles.bubble,
                  isMe
                    ? [styles.bubbleMe, { backgroundColor: colors.primary }]
                    : [styles.bubbleThem, { backgroundColor: colors.surface, borderColor: colors.border }],
                ]}
              >
                <Text style={[styles.bubbleText, { color: isMe ? "#fff" : colors.text }]}>
                  {item.text}
                </Text>
                <View style={styles.bubbleMeta}>
                  <Text
                    style={[
                      styles.bubbleTime,
                      { color: isMe ? "rgba(255,255,255,0.7)" : colors.mutedForeground },
                    ]}
                  >
                    {item.time}
                  </Text>
                  {isMe && (
                    <Feather
                      name={item.read ? "check-circle" : "check"}
                      size={12}
                      color="rgba(255,255,255,0.7)"
                    />
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Input */}
      <View
        style={[
          styles.inputBar,
          {
            borderTopColor: colors.border,
            backgroundColor: colors.background,
            paddingBottom: bottomPad + 8,
          },
        ]}
      >
        <TouchableOpacity style={[styles.attachBtn, { backgroundColor: colors.surface }]}>
          <Feather name="paperclip" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
        <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text, fontFamily: "SpaceGrotesk_400Regular" }]}
            placeholder="Mensagem..."
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
          />
        </View>
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.surface }]}
          onPress={send}
          activeOpacity={0.8}
        >
          <Feather name="send" size={18} color={input.trim() ? "#fff" : colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  headerName: { fontSize: 16, fontFamily: "SpaceGrotesk_600SemiBold" },
  headerStatus: { fontSize: 12, fontFamily: "SpaceGrotesk_400Regular", marginTop: 1 },
  iconBtn: { width: 36, height: 36, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  msgList: { paddingHorizontal: 16, paddingVertical: 12, gap: 6 },
  msgRow: { flexDirection: "row", marginBottom: 4 },
  msgLeft: { justifyContent: "flex-start" },
  msgRight: { justifyContent: "flex-end" },
  bubble: { maxWidth: "80%", borderRadius: 16, padding: 12 },
  bubbleMe: { borderTopRightRadius: 4 },
  bubbleThem: { borderTopLeftRadius: 4, borderWidth: 1 },
  bubbleText: { fontSize: 15, fontFamily: "SpaceGrotesk_400Regular", lineHeight: 21 },
  bubbleMeta: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 4 },
  bubbleTime: { fontSize: 11, fontFamily: "SpaceGrotesk_400Regular" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  attachBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  inputWrap: { flex: 1, borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  input: { fontSize: 15, maxHeight: 100, lineHeight: 22 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { fontSize: 16, fontFamily: "SpaceGrotesk_400Regular" },
});
