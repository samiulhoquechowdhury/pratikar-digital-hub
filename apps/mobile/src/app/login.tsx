import { formatIndianMobile } from "@pratikar/types";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, TextInput } from "@/components/Typography";
import { Button, Notice } from "@/components/ui";
import { useOtpFlow } from "@/features/auth/useOtpFlow";
import { siteUrl } from "@/lib/config";
import { colors, fonts, gradients, radius, space, text } from "@/lib/theme";

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment -- how React Native loads an image asset
const LOGO = require("../../assets/icon.png") as number;

const CODE_LENGTH = 6;

/**
 * Sign in or sign up with a mobile number: the number, then the 6-digit
 * code texted to it. Signing in is what the app's gate waits for, so a
 * verified code leads straight into the app.
 */
export default function LoginScreen() {
  const flow = useOtpFlow();
  const { top, bottom } = useSafeAreaInsets();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const back = () => {
    if (flow.step === "enter-otp") {
      setOtp("");
      flow.reset();
    } else if (router.canGoBack()) router.back();
    else router.replace("/welcome");
  };

  // Demo mode: the code is known, so it's filled in — still verified by a tap.
  useEffect(() => {
    if (flow.step === "enter-otp" && flow.demoCode) setOtp(flow.demoCode);
  }, [flow.step, flow.demoCode]);

  const submitCode = (code: string) => {
    setOtp(code);
    if (code.length === CODE_LENGTH) void flow.verifyOtp(code);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <LinearGradient colors={gradients.hero} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={[styles.top, { paddingTop: top + space.md }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                flow.step === "enter-otp" ? "Change number" : "Back"
              }
              hitSlop={10}
              onPress={back}
              style={styles.back}
            >
              <ArrowLeft color={colors.ink} size={20} />
            </Pressable>
            <Image
              source={LOGO}
              accessibilityLabel="Pratikar logo"
              style={styles.mark}
            />
          </View>

          <View style={[styles.sheet, { paddingBottom: bottom + space.xl }]}>
            {flow.step === "enter-otp" || flow.step === "verified" ? (
              <View style={styles.form}>
                <View style={{ gap: space.xs }}>
                  <Text style={text.title} accessibilityRole="header">
                    Enter the code
                  </Text>
                  <Text style={text.muted}>
                    {flow.demoCode
                      ? "Signing in as "
                      : "We texted a 6-digit code to "}
                    <Text style={{ fontWeight: "700", color: colors.ink }}>
                      {formatIndianMobile(flow.identifier)}
                    </Text>
                  </Text>
                </View>

                {flow.demoCode ? (
                  <Notice tone="warning">
                    Demo mode: text messages aren't set up yet, so every number
                    uses the code {flow.demoCode}. It's filled in for you.
                  </Notice>
                ) : null}

                <CodeBoxes
                  value={otp}
                  onChange={submitCode}
                  error={!!flow.error}
                />
                {flow.error ? (
                  <Text style={styles.error} accessibilityLiveRegion="polite">
                    {flow.error}
                  </Text>
                ) : null}

                <Button
                  label={
                    flow.step === "verified"
                      ? flow.isNewUser
                        ? "Account created — signing you in…"
                        : "Signing you in…"
                      : "Verify and continue"
                  }
                  loading={flow.isSubmitting}
                  disabled={
                    otp.length !== CODE_LENGTH || flow.step === "verified"
                  }
                  onPress={() => void flow.verifyOtp(otp)}
                />

                <View style={styles.row}>
                  <Pressable
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={back}
                  >
                    <Text style={styles.link}>Change number</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: flow.resendIn > 0 }}
                    disabled={flow.resendIn > 0}
                    hitSlop={10}
                    onPress={() => {
                      setOtp("");
                      void flow.resend();
                    }}
                  >
                    <Text
                      style={[
                        styles.link,
                        flow.resendIn > 0 && { color: colors.inkSubtle },
                      ]}
                    >
                      {flow.resendIn > 0
                        ? `Resend in ${flow.resendIn}s`
                        : "Resend code"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.form}>
                <View style={{ gap: space.xs }}>
                  <Text style={text.title} accessibilityRole="header">
                    Your mobile number
                  </Text>
                  <Text style={text.muted}>
                    We'll text you a 6-digit code. There's no password to
                    remember.
                  </Text>
                </View>

                <View
                  style={[styles.phone, flow.error ? styles.phoneError : null]}
                >
                  <View style={styles.prefix}>
                    <Text style={styles.prefixText}>+91</Text>
                  </View>
                  <TextInput
                    accessibilityLabel="Mobile number"
                    value={phone}
                    onChangeText={(value) =>
                      setPhone(value.replace(/[^\d ]/g, ""))
                    }
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    maxLength={11}
                    placeholder="98765 43210"
                    placeholderTextColor={colors.inkSubtle}
                    autoFocus
                    onSubmitEditing={() => void flow.requestOtp(phone)}
                    returnKeyType="send"
                    style={styles.phoneInput}
                  />
                </View>
                {flow.error ? (
                  <Text style={styles.error} accessibilityLiveRegion="polite">
                    {flow.error}
                  </Text>
                ) : null}

                <Button
                  label="Send code"
                  loading={flow.isSubmitting}
                  disabled={phone.replace(/\D/g, "").length < 10}
                  onPress={() => void flow.requestOtp(phone)}
                />
              </View>
            )}

            <Text style={[text.small, styles.legal]}>
              By continuing you agree to our{" "}
              <Link label="Terms" path="/terms" /> and{" "}
              <Link label="Privacy Policy" path="/privacy" />.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

/**
 * Six boxes over one hidden field: the field does the typing, paste and
 * SMS autofill; the boxes show where you are.
 */
function CodeBoxes({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error: boolean;
}) {
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  return (
    <Pressable
      accessibilityLabel={`Verification code, ${value.length} of ${CODE_LENGTH} digits entered`}
      onPress={() => input.current?.focus()}
      style={styles.boxes}
    >
      {Array.from({ length: CODE_LENGTH }, (_, i) => {
        const filled = i < value.length;
        const current = i === value.length;
        return (
          <View
            key={i}
            style={[
              styles.box,
              filled && styles.boxFilled,
              current && styles.boxCurrent,
              error && styles.boxError,
            ]}
          >
            <Text style={styles.digit}>{value[i] ?? ""}</Text>
          </View>
        );
      })}
      <TextInput
        ref={input}
        value={value}
        onChangeText={(next) =>
          onChange(next.replace(/\D/g, "").slice(0, CODE_LENGTH))
        }
        keyboardType="number-pad"
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        maxLength={CODE_LENGTH}
        autoFocus
        caretHidden
        style={styles.hidden}
      />
    </Pressable>
  );
}

function Link({ label, path }: { label: string; path: string }) {
  return (
    <Text
      accessibilityRole="link"
      style={styles.legalLink}
      onPress={() => void WebBrowser.openBrowserAsync(siteUrl(path))}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  top: {
    alignItems: "center",
    paddingHorizontal: space.xl,
    paddingBottom: space.xxl,
  },
  back: {
    alignSelf: "flex-start",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  mark: { width: 84, height: 84, borderRadius: 26, marginTop: space.sm },
  sheet: {
    flexGrow: 1,
    gap: space.xl,
    padding: space.xl,
    paddingTop: space.xxl,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.line,
  },
  form: { gap: space.lg },
  phone: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    borderWidth: 1.5,
    borderColor: colors.gold,
    borderRadius: radius.control,
    backgroundColor: colors.raised,
    overflow: "hidden",
  },
  phoneError: { borderColor: colors.danger },
  prefix: {
    alignSelf: "stretch",
    justifyContent: "center",
    paddingHorizontal: space.lg,
    backgroundColor: colors.raisedHigh,
    borderRightWidth: 1,
    borderRightColor: colors.lineStrong,
  },
  prefixText: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  phoneInput: {
    flex: 1,
    minHeight: 56,
    paddingHorizontal: space.lg,
    fontSize: 18,
    letterSpacing: 1,
    color: colors.ink,
  },
  error: { fontSize: 13.5, color: colors.danger },
  boxes: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: space.sm,
  },
  box: {
    flex: 1,
    aspectRatio: 0.86,
    maxHeight: 64,
    borderRadius: radius.control,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.canvas,
  },
  boxFilled: {
    backgroundColor: colors.raised,
    borderColor: colors.lineStrong,
  },
  boxCurrent: { borderColor: colors.gold, backgroundColor: colors.raised },
  boxError: { borderColor: colors.danger },
  digit: {
    alignSelf: "stretch",
    textAlign: "center",
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.ink,
  },
  // Still focusable and fillable by the keyboard's SMS suggestion.
  hidden: { position: "absolute", width: 1, height: 1, opacity: 0 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  link: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.link },
  legal: { marginTop: "auto", paddingTop: space.md },
  legalLink: {
    color: colors.primary,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
