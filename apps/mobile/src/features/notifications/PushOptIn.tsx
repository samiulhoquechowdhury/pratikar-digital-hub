import { useEffect, useState } from "react";
import { Linking, View } from "react-native";

import { Text } from "@/components/Typography";
import { Button } from "@/components/ui";
import { space, text } from "@/lib/theme";

import { pushPermission, registerForPush, type PushPermission } from "./push";

/**
 * "Tell me when it's ready" — the website's PushOptIn. Shown where waiting
 * is the next step (a review in progress). Nothing at all once allowed, or
 * on an emulator, where push can't arrive.
 */
export function PushOptIn() {
  const [status, setStatus] = useState<PushPermission | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void pushPermission().then(setStatus);
  }, []);

  if (status === null || status === "granted" || status === "unavailable")
    return null;

  if (status === "denied") {
    return (
      <View style={{ gap: space.sm }}>
        <Text style={text.small}>
          Notifications are off for Pratikar. Turn them on in Settings to hear
          the moment it's ready.
        </Text>
        <Button
          label="Open settings"
          variant="secondary"
          onPress={() => void Linking.openSettings()}
        />
      </View>
    );
  }

  return (
    <Button
      label="Notify me on this phone"
      variant="secondary"
      loading={busy}
      onPress={async () => {
        setBusy(true);
        setStatus(
          await registerForPush({ ask: true }).catch(() => "denied" as const),
        );
        setBusy(false);
      }}
    />
  );
}
