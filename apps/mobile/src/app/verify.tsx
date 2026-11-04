import type { CertificateVerification } from "@pratikar/types";
import { Stack, useLocalSearchParams } from "expo-router";
import { BadgeCheck, ShieldAlert } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { Text } from "@/components/Typography";
import { Button, Field } from "@/components/ui";
import { lmsApi } from "@/features/lms/lmsApi";
import { colors, radius, space, text } from "@/lib/theme";

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/**
 * Check a Pratikar certificate by its code — public, no account needed, so
 * an employer can confirm a candidate's claim.
 */
export default function VerifyScreen() {
  const params = useLocalSearchParams<{ code?: string }>();
  const [code, setCode] = useState(params.code ?? "");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CertificateVerification | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = async (value = code) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setChecking(true);
    setError(null);
    setResult(null);
    try {
      setResult(await lmsApi.verifyCertificate(trimmed));
    } catch {
      setError("Couldn't check that code just now. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (params.code) void check(params.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.code]);

  return (
    <ScrollView
      contentContainerStyle={styles.body}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: "Verify a certificate" }} />
      <Text style={text.muted}>
        Enter the code printed on a Pratikar certificate to confirm it's
        genuine.
      </Text>
      <Field
        label="Verification code"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        autoCorrect={false}
        error={error}
        onSubmitEditing={() => void check()}
        returnKeyType="search"
      />
      <Button label="Check" loading={checking} onPress={() => void check()} />

      {result ? (
        result.valid ? (
          <View
            style={[styles.result, { backgroundColor: colors.successSubtle }]}
            accessibilityLiveRegion="polite"
          >
            <BadgeCheck color={colors.success} size={28} />
            <Text style={[text.heading, { color: colors.success }]}>
              Genuine certificate
            </Text>
            {result.holderName ? (
              <Text style={text.body}>Awarded to {result.holderName}</Text>
            ) : null}
            {result.courseTitle ? (
              <Text style={text.body}>for {result.courseTitle}</Text>
            ) : null}
            {result.issuedAt ? (
              <Text style={text.small}>Issued {longDate(result.issuedAt)}</Text>
            ) : null}
            {result.scorePercent != null ? (
              <Text style={text.small}>
                Overall score {result.scorePercent}%
              </Text>
            ) : null}
          </View>
        ) : (
          <View
            style={[styles.result, { backgroundColor: colors.dangerSubtle }]}
            accessibilityLiveRegion="polite"
          >
            <ShieldAlert color={colors.danger} size={28} />
            <Text style={[text.heading, { color: colors.danger }]}>
              No certificate with that code
            </Text>
            <Text style={text.muted}>
              Check the code for typos. A real certificate always verifies here.
            </Text>
          </View>
        )
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.lg },
  result: {
    gap: space.sm,
    padding: space.xl,
    borderRadius: radius.card,
    alignItems: "flex-start",
  },
});
