import { isRunningInExpoGo } from "expo";
import { Alert, Platform } from "react-native";

/** Running in a browser (`expo start --web`) — a preview, not the product. */
export const IS_WEB = Platform.OS === "web";

/** Running inside the Expo Go app rather than a build of our own. */
export const IN_EXPO_GO = isRunningInExpoGo();

/**
 * Native modules that only a real build carries: Razorpay's SDK and push.
 * Neither Expo Go nor the browser preview can load them.
 */
export const NATIVE_BUILD = !IS_WEB && !IN_EXPO_GO;

/**
 * "Are you sure?" — Alert.alert on a phone. React Native's Alert does
 * nothing in a browser, so there it's the browser's own confirm().
 */
export function confirmAction({
  title,
  message,
  confirmLabel,
  destructive = false,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}): void {
  if (IS_WEB) {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    {
      text: confirmLabel,
      style: destructive ? "destructive" : "default",
      onPress: onConfirm,
    },
  ]);
}
