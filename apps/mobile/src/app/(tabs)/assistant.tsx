import { grossPaise } from "@pratikar/utils";
import { useQuery } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowRight,
  ArrowUp,
  FilePenLine,
  Info,
  Languages,
  RotateCcw,
  Search,
  Sparkles,
  Square,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { PageHeader } from "@/components/PageHeader";
import { Text, TextInput } from "@/components/Typography";
import { IconTile } from "@/components/ui";
import {
  assistantApi,
  ChatError,
  CHAT_LIMITS,
  cleanAnswer,
  type ChatFailure,
  type ChatSource,
  type ChatTurn,
} from "@/features/assistant/assistantApi";
import { formatPrice } from "@/lib/format";
import { openSitePath } from "@/lib/links";
import {
  colors,
  fonts,
  gradients,
  radius,
  shadow,
  space,
  text,
} from "@/lib/theme";

interface Message {
  id: number;
  role: "you" | "assistant";
  text: string;
  sources?: ChatSource[];
  /** The assistant offered a custom draft; carries the question it was for. */
  draftFor?: string;
  streaming?: boolean;
}

/** The website's FAILURE_REPLIES, word for word. */
const FAILURE_REPLIES: Record<ChatFailure, string> = {
  busy: "I'm getting a lot of questions right now. Please try again in a moment.",
  "too-fast":
    "You're asking faster than I can keep up. Wait a minute, then try again.",
  failed:
    "Something went wrong on our side. Please try again, or browse Documents, Courses and the Library directly.",
  "not-configured":
    "The assistant is offline right now. You can still search or draft a document yourself.",
};

const CAPABILITIES = [
  {
    icon: Search,
    text: "Finds the right course, document template, legal form or e-book for what you're dealing with.",
  },
  {
    icon: FilePenLine,
    text: "Can't find your document? It sets up a custom draft, which an advocate reviews before you download it.",
  },
  { icon: Languages, text: "Ask in English, Hindi or your own language." },
];

const toTurns = (messages: Message[], question: string): ChatTurn[] => [
  ...messages
    .filter((m) => m.text.trim())
    .map((m) => ({
      role: m.role === "you" ? ("user" as const) : ("assistant" as const),
      content: m.role === "you" ? m.text : cleanAnswer(m.text),
    })),
  { role: "user", content: question },
];

/**
 * Pratikar AI: the website's assistant as a tab. Answers come from what the
 * site sells, streamed as they're written, with the items it cites as cards
 * underneath. It points at material; it never advises on someone's case,
 * and the banner says so the whole time.
 */
export default function AssistantScreen() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  const status = useQuery({
    queryKey: ["assistant-status"],
    queryFn: assistantApi.status,
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const nextId = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const conversationRef = useRef(Crypto.randomUUID());
  const listRef = useRef<FlatList<Message>>(null);
  const askedInitial = useRef(false);

  const live = status.data?.assistant !== false && !offline;

  const patch = (id: number, change: (m: Message) => Partial<Message>) =>
    setMessages((all) =>
      all.map((m) => (m.id === id ? { ...m, ...change(m) } : m)),
    );

  const send = (raw: string) => {
    const question = raw.trim().slice(0, CHAT_LIMITS.maxTurnLength);
    if (!question || busy) return;

    const turns = toTurns(messages, question);
    const replyId = nextId.current + 1;
    nextId.current += 2;
    setMessages((m) => [
      ...m,
      { id: replyId - 1, role: "you", text: question },
      { id: replyId, role: "assistant", text: "", streaming: true },
    ]);
    setDraft("");
    setBusy(true);

    const abort = new AbortController();
    abortRef.current = abort;

    assistantApi
      .stream(
        turns,
        (event) => {
          switch (event.type) {
            case "delta":
              patch(replyId, (m) => ({ text: m.text + event.text }));
              break;
            case "reset":
              patch(replyId, () => ({ text: "" }));
              break;
            case "done":
              patch(replyId, () => ({
                text: event.answer,
                sources: event.sources,
                draftFor: event.suggestDraft ? question : undefined,
                streaming: false,
              }));
              break;
            case "error":
              patch(replyId, () => ({
                text: FAILURE_REPLIES[
                  event.reason === "AI_BUSY" ? "busy" : "failed"
                ],
                streaming: false,
              }));
              break;
          }
        },
        abort.signal,
        conversationRef.current,
      )
      .catch((error: unknown) => {
        const reason = error instanceof ChatError ? error.reason : "failed";
        if (reason === "not-configured") setOffline(true);
        patch(replyId, () => ({
          text: FAILURE_REPLIES[reason],
          streaming: false,
        }));
      })
      .finally(() => {
        patch(replyId, (m) => ({
          streaming: false,
          text: m.text || (abort.signal.aborted ? "Stopped." : m.text),
        }));
        setBusy(false);
        abortRef.current = null;
      });
  };

  // A question handed over from elsewhere (search, a document page) is
  // asked once the assistant is known to be live.
  useEffect(() => {
    if (q && !askedInitial.current && status.data?.assistant) {
      askedInitial.current = true;
      send(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status.data?.assistant]);

  const stop = () => abortRef.current?.abort();
  const startOver = () => {
    stop();
    setMessages([]);
    conversationRef.current = Crypto.randomUUID();
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <PageHeader
        title="Pratikar AI"
        action={
          messages.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={startOver}
              style={styles.startOver}
              hitSlop={8}
            >
              <RotateCcw color={colors.noir} size={14} />
              <Text style={styles.startOverText}>New chat</Text>
            </Pressable>
          ) : undefined
        }
      />
      <View style={styles.banner}>
        <Info color={colors.goldInk} size={14} />
        <Text style={styles.bannerText}>
          {live
            ? "Answers from our catalogue, and can be wrong. Not legal advice."
            : "Pratikar AI is offline right now."}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={styles.log}
        onContentSizeChange={() => listRef.current?.scrollToEnd()}
        keyboardShouldPersistTaps="handled"
        accessibilityLabel="Conversation"
        ListEmptyComponent={
          status.isPending ? (
            <ActivityIndicator color={colors.noir} style={{ marginTop: 48 }} />
          ) : live ? (
            <Welcome />
          ) : (
            <Offline />
          )
        }
        renderItem={({ item }) =>
          item.role === "you" ? (
            <View style={styles.youRow}>
              <Text style={styles.you}>{item.text}</Text>
            </View>
          ) : (
            <Reply message={item} />
          )
        }
      />

      <View style={styles.composer}>
        <TextInput
          accessibilityLabel="Ask a question"
          value={draft}
          onChangeText={setDraft}
          editable={live}
          multiline
          maxLength={CHAT_LIMITS.maxTurnLength}
          placeholder={
            live
              ? "Describe your situation or what you need…"
              : "Pratikar AI is offline"
          }
          placeholderTextColor={colors.inkSubtle}
          style={styles.input}
        />
        {busy ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Stop"
            onPress={stop}
            style={[styles.send, styles.stop]}
          >
            <Square color={colors.noir} size={18} />
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send"
            accessibilityState={{ disabled: !draft.trim() || !live }}
            disabled={!draft.trim() || !live}
            onPress={() => send(draft)}
            style={[styles.send, (!draft.trim() || !live) && { opacity: 0.4 }]}
          >
            <ArrowUp color={colors.inkInverse} size={20} />
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function Welcome() {
  return (
    <View style={styles.welcome}>
      <LinearGradient
        colors={gradients.gold}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.welcomeBadge}
      >
        <Sparkles color={colors.noir} size={28} />
      </LinearGradient>
      <Text style={text.title}>How can I help?</Text>
      {CAPABILITIES.map((item) => (
        <View key={item.text} style={styles.capability}>
          <IconTile icon={item.icon} size={38} />
          <Text style={[text.muted, { flex: 1 }]}>{item.text}</Text>
        </View>
      ))}
    </View>
  );
}

function Offline() {
  return (
    <View style={{ gap: space.md }}>
      <Text style={text.heading}>Pratikar AI is offline</Text>
      <Text style={text.muted}>
        You can still search the catalogue or draft a document yourself.
      </Text>
      <Text
        accessibilityRole="link"
        style={styles.link}
        onPress={() => router.push("/explore")}
      >
        Explore the catalogue
      </Text>
    </View>
  );
}

function Reply({ message }: { message: Message }) {
  const body = cleanAnswer(message.text);
  const paragraphs = body.split(/\n+/).filter((p) => p.trim());
  return (
    <View style={styles.replyRow} accessibilityLiveRegion="polite">
      <View style={styles.replyIcon}>
        <Sparkles color={colors.gold} size={15} />
      </View>
      <View style={{ flex: 1, gap: space.md }}>
        {paragraphs.length === 0 && message.streaming ? (
          <ActivityIndicator
            color={colors.inkSubtle}
            style={{ alignSelf: "flex-start" }}
          />
        ) : (
          paragraphs.map((p, i) => (
            <Text key={i} style={styles.replyText}>
              {p}
            </Text>
          ))
        )}
        {message.sources?.map((source) => (
          <SourceCard
            key={source.sourceType + source.sourceId}
            source={source}
          />
        ))}
        {message.draftFor ? (
          <Pressable
            accessibilityRole="link"
            onPress={() =>
              router.push({
                pathname: "/documents/custom",
                params: { type: message.draftFor!.slice(0, 120) },
              })
            }
            style={styles.draftOffer}
          >
            <View style={styles.draftIcon}>
              <FilePenLine color={colors.noir} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={text.subheading}>Draft it with AI</Text>
              <Text style={text.small}>
                Free to draft and preview · reviewed by an advocate before
                download
              </Text>
            </View>
            <ArrowRight color={colors.inkSubtle} size={18} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function SourceCard({ source }: { source: ChatSource }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => openSitePath(source.href, router.push)}
      style={({ pressed }) => [
        styles.source,
        pressed && { borderColor: colors.noir },
      ]}
    >
      <Text style={styles.sourceKind}>{source.kind}</Text>
      <Text style={text.subheading} numberOfLines={2}>
        {source.title}
      </Text>
      <Text style={text.small}>
        {source.sourceType === "faq"
          ? "From our FAQ"
          : `${formatPrice(grossPaise(source.priceInPaise))} incl. GST`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    marginHorizontal: space.lg,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.control,
    backgroundColor: colors.banner.sand,
  },
  bannerText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
    color: colors.goldInk,
  },
  startOver: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: space.md,
    minHeight: 36,
    marginTop: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  startOverText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.noir,
  },
  log: { padding: space.lg, gap: space.lg, flexGrow: 1 },
  youRow: { alignItems: "flex-end" },
  you: {
    maxWidth: "85%",
    backgroundColor: colors.noir,
    color: colors.inkInverse,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm + 2,
    borderRadius: 20,
    borderBottomRightRadius: 6,
    overflow: "hidden",
  },
  replyRow: { flexDirection: "row", gap: space.md },
  replyIcon: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: colors.noir,
    alignItems: "center",
    justifyContent: "center",
  },
  replyText: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 23,
    color: colors.ink,
  },
  source: {
    borderRadius: radius.control + 2,
    padding: space.md,
    gap: 4,
    backgroundColor: colors.surface,
    ...shadow,
  },
  sourceKind: { ...text.eyebrow, fontSize: 10.5, color: colors.inkSubtle },
  draftOffer: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.md,
    borderRadius: radius.control + 2,
    backgroundColor: colors.banner.sand,
  },
  draftIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  welcome: { gap: space.lg, paddingTop: space.sm },
  welcomeBadge: {
    width: 60,
    height: 60,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  capability: {
    flexDirection: "row",
    gap: space.md,
    alignItems: "center",
    padding: space.md,
    borderRadius: radius.control + 2,
    backgroundColor: colors.surface,
    ...shadow,
  },
  link: { fontFamily: fonts.bold, color: colors.noir, fontSize: 15 },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + 2,
    backgroundColor: colors.canvas,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 48,
    borderRadius: 24,
    paddingHorizontal: space.lg + 2,
    paddingTop: 13,
    paddingBottom: 13,
    fontSize: 15.5,
    color: colors.ink,
    backgroundColor: colors.surface,
    ...shadow,
  },
  send: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.noir,
    alignItems: "center",
    justifyContent: "center",
  },
  stop: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.noir,
  },
});
