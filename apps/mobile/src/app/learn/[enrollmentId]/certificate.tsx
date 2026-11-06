import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { BadgeCheck, Share2 } from "lucide-react-native";
import { ScrollView, Share, StyleSheet, View } from "react-native";

import { Text } from "@/components/Typography";
import { Button, StateView } from "@/components/ui";
import { lmsApi } from "@/features/lms/lmsApi";
import { api } from "@/lib/api";
import { siteUrl } from "@/lib/config";
import { colors, radius, space, text } from "@/lib/theme";
import { useAuth } from "@/providers/AuthProvider";

/** The certificate's wording, edited in Admin → Settings. */
interface CertificateDesign {
  title: string;
  issuerName: string;
  signatoryName: string;
  signatoryTitle: string;
  footerNote: string;
}

const DEFAULT_DESIGN: CertificateDesign = {
  title: "Certificate of Completion",
  issuerName: "Pratikar Digital Hub",
  signatoryName: "",
  signatoryTitle: "",
  footerNote: "",
};

const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/**
 * The certificate on the phone, and the link that proves it. The printable
 * copy with its QR code is on the website; here, sharing the verification
 * link is what an employer or client actually needs.
 */
export default function CertificateScreen() {
  const { enrollmentId } = useLocalSearchParams<{ enrollmentId: string }>();
  const { user } = useAuth();
  const outline = useQuery({
    queryKey: ["outline", enrollmentId],
    queryFn: () => lmsApi.getOutline(enrollmentId),
  });
  const design = useQuery({
    queryKey: ["certificate-design"],
    queryFn: () => api.get<CertificateDesign>("/settings/certificate"),
  });

  if (outline.isPending) return <StateView loading />;
  const cert = outline.data?.certificate;
  if (!outline.data || !cert) {
    return (
      <StateView
        title="No certificate yet"
        body="Finish every lesson and reach the pass mark, and it's issued straight away."
      />
    );
  }
  const d = design.data ?? DEFAULT_DESIGN;
  const link = siteUrl(`/verify/${cert.verificationCode}`);

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Stack.Screen options={{ title: "Certificate" }} />
      <View
        style={styles.certificate}
        accessible
        accessibilityLabel={`${d.title}, ${outline.data.courseTitle}`}
      >
        <BadgeCheck color={colors.gold} size={36} />
        <Text style={styles.issuer}>{d.issuerName}</Text>
        <Text style={styles.title}>{d.title}</Text>
        <Text style={styles.lead}>This certifies that</Text>
        <Text style={styles.name}>{user?.name ?? "the holder"}</Text>
        <Text style={styles.lead}>has completed</Text>
        <Text style={styles.course}>{outline.data.courseTitle}</Text>
        {cert.scorePercent !== null ? (
          <Text style={styles.meta}>
            with an overall score of {cert.scorePercent}%
          </Text>
        ) : null}
        <Text style={styles.meta}>Issued {longDate(cert.issuedAt)}</Text>
        {d.signatoryName ? (
          <Text style={styles.meta}>
            {d.signatoryName}
            {d.signatoryTitle ? `, ${d.signatoryTitle}` : ""}
          </Text>
        ) : null}
        <Text style={styles.code}>
          Verification code {cert.verificationCode}
        </Text>
        {d.footerNote ? (
          <Text style={styles.footer}>{d.footerNote}</Text>
        ) : null}
      </View>

      <Button
        label="Share the verification link"
        icon={<Share2 color={colors.onPrimary} size={18} />}
        onPress={() =>
          void Share.share({
            message: `My certificate for ${outline.data.courseTitle} from ${d.issuerName}: ${link}`,
          })
        }
      />
      <Button
        variant="secondary"
        label="Open the verification page"
        onPress={() => void WebBrowser.openBrowserAsync(link)}
      />
      <Text style={text.small}>
        Anyone can check the code on the verification page — no account needed.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.lg, paddingBottom: space.xxl * 2 },
  certificate: {
    alignItems: "center",
    gap: space.sm,
    padding: space.xl,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.card,
  },
  issuer: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "800",
    alignSelf: "stretch",
    textAlign: "center",
  },
  lead: { color: colors.inkMuted, fontSize: 13, marginTop: space.sm },
  name: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "700",
    alignSelf: "stretch",
    textAlign: "center",
  },
  course: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: "700",
    alignSelf: "stretch",
    textAlign: "center",
  },
  meta: {
    color: colors.inkMuted,
    fontSize: 13,
    alignSelf: "stretch",
    textAlign: "center",
  },
  code: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
    marginTop: space.md,
    letterSpacing: 0.5,
  },
  footer: {
    color: colors.inkMuted,
    fontSize: 11,
    alignSelf: "stretch",
    textAlign: "center",
    marginTop: space.sm,
  },
});
