import { GST_STATE_NAMES, type DraftCustomPayload } from "@pratikar/types";
import { useQuery } from "@tanstack/react-query";
import { router, Stack, useLocalSearchParams } from "expo-router";
import {
  BadgeCheck,
  Download,
  FilePenLine,
  Sparkles,
} from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { StagePill } from "@/components/StagePill";
import { Text } from "@/components/Typography";
import { Button, Field, Notice, StateView } from "@/components/ui";
import { DocumentActions } from "@/features/documents/DocumentActions";
import { DocumentPreview } from "@/features/documents/DocumentPreview";
import { documentStage } from "@/features/documents/documentStage";
import {
  documentsApi,
  type MyDocument,
} from "@/features/documents/documentsApi";
import { PushOptIn } from "@/features/notifications/PushOptIn";
import { BuyPanel } from "@/features/payments/BuyPanel";
import { ApiError } from "@/lib/api";
import { saveAndShare } from "@/lib/download";
import { formatDate } from "@/lib/format";
import { colors, radius, space, text, shadow } from "@/lib/theme";

const MAX_INSTRUCTION = 1000;
const MAX_REVISIONS = 5;
const DRAFTING_POLL_MS = 4000;
const REVIEW_POLL_MS = 30_000;

/**
 * One document on the account, wherever it is in its life — the website's
 * DocumentDetail. An AI draft goes draft → advocate review → download; a
 * template document is paid for and downloaded, with a review on the side.
 * Checks back on its own while something is happening on our side.
 */
export default function DocumentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const doc = useQuery({
    queryKey: ["my-document", id],
    queryFn: () => documentsApi.getMine(id),
    refetchInterval: (q) => {
      const d = q.state.data;
      if (!d || !documentStage(d).inProgress) return false;
      return d.ready ? REVIEW_POLL_MS : DRAFTING_POLL_MS;
    },
  });

  if (doc.isPending) return <StateView loading />;
  if (doc.isError || !doc.data) {
    const missing = doc.error instanceof ApiError && doc.error.status === 404;
    return (
      <StateView
        title={
          missing
            ? "We couldn't find that document"
            : "Couldn't load this document"
        }
        action={
          missing ? (
            <Button
              label="All my documents"
              onPress={() => router.replace("/account/documents")}
            />
          ) : (
            <Button label="Try again" onPress={() => void doc.refetch()} />
          )
        }
      />
    );
  }

  const d = doc.data;
  const stage = documentStage(d);
  const custom = d.kind === "CUSTOM";
  const reload = async () => {
    await doc.refetch();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.body}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: custom ? "AI draft" : "Document" }} />
      <View style={{ gap: space.sm }}>
        <Text style={text.title}>{d.title}</Text>
        <Text style={text.small}>
          {custom ? "AI draft" : "From a template"} · started{" "}
          {formatDate(d.createdAt)}
        </Text>
        <StagePill label={stage.label} tone={stage.tone} />
      </View>

      {custom ? <Steps doc={d} /> : null}

      {d.ready ? (
        <DocumentPreview key={d.revisionCount} documentId={d.id} />
      ) : d.draftError ? (
        <View style={{ gap: space.md }}>
          <Notice tone="danger">{d.draftError}</Notice>
          {d.brief ? <RequestSummary brief={d.brief} /> : null}
          <Button
            label="Edit and try again"
            icon={<FilePenLine color={colors.onPrimary} size={18} />}
            onPress={() =>
              router.push({
                pathname: "/documents/custom",
                params: { from: d.id },
              })
            }
          />
          <Button
            label="Start a new draft"
            variant="secondary"
            onPress={() => router.push("/documents/custom")}
          />
        </View>
      ) : (
        <Drafting
          revising={d.revisionCount > 0}
          brief={d.revisionCount > 0 ? null : d.brief}
        />
      )}

      {custom && d.ready && d.draftError ? (
        <Notice tone="warning">{d.draftError}</Notice>
      ) : null}
      {custom && d.ready ? <DraftNotes doc={d} /> : null}
      {custom && d.ready && !d.review ? (
        <ReviseBox doc={d} onRevised={reload} />
      ) : null}
      {!custom && d.ready ? (
        <DocumentActions
          documentId={d.id}
          template={{
            title: d.title,
            priceInPaise: d.priceInPaise ?? 0,
            reviewPriceInPaise: d.reviewPriceInPaise,
          }}
          initialStatus={d.status}
          showReview={false}
          onChange={() => void reload()}
        />
      ) : null}
      {d.ready ? <ReviewPanel doc={d} onChange={reload} /> : null}
    </ScrollView>
  );
}

function Steps({ doc }: { doc: MyDocument }) {
  const current = !doc.ready ? 0 : doc.review?.status === "RETURNED" ? 2 : 1;
  const steps = [
    { icon: Sparkles, label: "AI draft" },
    { icon: BadgeCheck, label: "Review" },
    { icon: Download, label: "Download" },
  ];
  return (
    <View style={styles.steps}>
      {steps.map((step, index) => {
        const done = index < current;
        const isCurrent = index === current;
        return (
          <View
            key={step.label}
            accessibilityState={{ selected: isCurrent }}
            style={[styles.step, isCurrent && styles.stepOn]}
          >
            <step.icon
              color={
                done
                  ? colors.success
                  : isCurrent
                    ? colors.goldText
                    : colors.inkSubtle
              }
              size={16}
            />
            <Text
              style={[
                styles.stepText,
                (done || isCurrent) && { color: colors.ink },
              ]}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function Drafting({
  revising,
  brief,
}: {
  revising: boolean;
  brief: DraftCustomPayload | null;
}) {
  return (
    <View style={{ gap: space.md }}>
      <View style={styles.drafting} accessibilityLiveRegion="polite">
        <ActivityIndicator color={colors.primary} />
        <Text style={text.subheading}>
          {revising ? "Making your changes…" : "Drafting your document…"}
        </Text>
        <Text style={[text.small, { textAlign: "center" }]}>
          This usually takes a minute or two. You can leave this screen — it
          will be in My documents when it's ready.
        </Text>
      </View>
      {brief ? <RequestSummary brief={brief} /> : null}
    </View>
  );
}

function RequestSummary({ brief }: { brief: DraftCustomPayload }) {
  const state = brief.stateCode ? GST_STATE_NAMES[brief.stateCode] : null;
  return (
    <View style={styles.panel}>
      <Text style={styles.eyebrow}>Your request</Text>
      <Text style={text.subheading}>
        {brief.documentType}
        {state ? <Text style={text.small}> · {state}</Text> : null}
      </Text>
      <Text style={text.muted}>{brief.details}</Text>
    </View>
  );
}

function DraftNotes({ doc }: { doc: MyDocument }) {
  if (
    !doc.summary &&
    doc.missingDetails.length === 0 &&
    doc.basedOn.length === 0
  )
    return null;
  return (
    <View style={styles.panel}>
      {doc.basedOn.length > 0 ? (
        <Text style={text.small}>
          Drafted in the format of our advocate-written{" "}
          {doc.basedOn.length === 1 ? "document" : "documents"}:{" "}
          <Text style={{ fontWeight: "700" }}>{doc.basedOn.join(" and ")}</Text>
          .
        </Text>
      ) : null}
      {doc.summary ? <Text style={text.body}>{doc.summary}</Text> : null}
      {doc.missingDetails.length > 0 ? (
        <View style={{ gap: space.xs }}>
          <Text style={text.subheading}>Left blank for you to complete</Text>
          {doc.missingDetails.map((item) => (
            <Text key={item} style={text.muted}>
              • {item}
            </Text>
          ))}
          <Text style={text.small}>
            Add them below and the draft is updated — or tell the advocate in
            your review.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function ReviseBox({
  doc,
  onRevised,
}: {
  doc: MyDocument;
  onRevised: () => Promise<void>;
}) {
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const left = MAX_REVISIONS - doc.revisionCount;

  const submit = async () => {
    if (!instruction.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await documentsApi.revise(doc.id, instruction.trim());
      setInstruction("");
      await onRevised();
    } catch (cause) {
      setError(
        cause instanceof Error &&
          cause.message.includes("REVISION_LIMIT_REACHED")
          ? "You've used all the changes for this draft. An advocate can make further changes in the review."
          : "Couldn't make that change. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: space.md }}>
      <Text style={text.heading}>Ask for changes</Text>
      <Field
        label="What should change?"
        value={instruction}
        onChangeText={setInstruction}
        maxLength={MAX_INSTRUCTION}
        editable={left > 0}
        multiline
        placeholder="e.g. The licensor's address is 12 MG Road, Pune. Make the notice period one month."
        hint="Fill in a blank, change a term, add a clause — in your own words."
        style={{ minHeight: 96, textAlignVertical: "top", paddingTop: 12 }}
        error={error}
      />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={text.small}>
          {left > 0
            ? `${left} change${left === 1 ? "" : "s"} left`
            : "No changes left"}
        </Text>
        <Button
          label={busy ? "Sending…" : "Update draft"}
          variant="secondary"
          loading={busy}
          disabled={!instruction.trim() || left <= 0}
          onPress={() => void submit()}
        />
      </View>
    </View>
  );
}

function ReviewPanel({
  doc,
  onChange,
}: {
  doc: MyDocument;
  onChange: () => Promise<void>;
}) {
  const review = doc.review;
  const [justPaid, setJustPaid] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const custom = doc.kind === "CUSTOM";

  const download = async () => {
    setDownloading(true);
    setError(null);
    try {
      const { fileUrl, pdfUrl: pdf } = await documentsApi.reviewedDownload(
        doc.id,
      );
      setPdfUrl(pdf);
      await saveAndShare(fileUrl, `${doc.title} (reviewed).docx`);
    } catch {
      setError("Couldn't start the download. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (review?.status === "RETURNED") {
    return (
      <View style={[styles.panel, { backgroundColor: colors.successSubtle }]}>
        <Text style={text.heading}>Reviewed by an advocate</Text>
        {review.returnedAt ? (
          <Text style={text.small}>
            Returned {formatDate(review.returnedAt)}
          </Text>
        ) : null}
        {review.notes ? (
          <View style={{ gap: space.xs }}>
            <Text style={styles.eyebrow}>Advocate's notes</Text>
            <Text style={text.body}>{review.notes}</Text>
          </View>
        ) : null}
        <Button
          label={downloading ? "Preparing…" : "Download reviewed document"}
          icon={<Download color={colors.onPrimary} size={18} />}
          loading={downloading}
          onPress={() => void download()}
        />
        {pdfUrl ? (
          <Button
            label="Save the PDF"
            variant="secondary"
            onPress={() =>
              void saveAndShare(pdfUrl, `${doc.title} (reviewed).pdf`).catch(
                () =>
                  setError(
                    "Couldn't save the PDF. Download again to get a fresh link.",
                  ),
              )
            }
          />
        ) : null}
        {error ? <Notice tone="danger">{error}</Notice> : null}
        <Text style={text.small}>
          You can download your reviewed document again any time from here.
        </Text>
      </View>
    );
  }

  if (review || justPaid) {
    return (
      <View style={styles.panel}>
        <Text style={text.heading}>
          {review?.status === "IN_REVIEW"
            ? "An advocate is reviewing it"
            : "Waiting for an advocate"}
        </Text>
        <Text style={text.muted}>
          We'll tell you by email and in your notifications the moment it's
          ready to download.
        </Text>
        <PushOptIn />
      </View>
    );
  }

  return (
    <View style={{ gap: space.md }}>
      <Text style={text.heading}>
        {custom ? "Send for advocate review" : "Add an advocate review"}
      </Text>
      <Text style={text.muted}>
        {custom
          ? "A practising advocate checks and corrects your draft. Once reviewed, it's ready to download as Word and PDF."
          : "An advocate checks this document and sends back a reviewed copy with comments."}
      </Text>
      {custom ? (
        <Text style={text.small}>
          Happy with the draft? Changes stop once it's sent.
        </Text>
      ) : null}
      <BuyPanel
        itemType="DOCUMENT_REVIEW"
        itemId={doc.id}
        label={`Advocate review: ${doc.title}`}
        priceInPaise={doc.reviewPriceInPaise}
        buyLabel={custom ? "Send for review" : "Buy a review"}
        onPaid={() => {
          setJustPaid(true);
          void onChange();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.xl, paddingBottom: space.xxl * 2 },
  steps: { flexDirection: "row", gap: space.sm },
  step: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: space.sm,
    borderRadius: radius.control,
    backgroundColor: colors.card,
    ...shadow,
  },
  stepOn: { borderColor: colors.gold, backgroundColor: colors.banner.sand },
  stepText: { fontSize: 13, fontWeight: "600", color: colors.inkSubtle },
  drafting: {
    alignItems: "center",
    gap: space.md,
    padding: space.xl,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    ...shadow,
  },
  panel: {
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    ...shadow,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
