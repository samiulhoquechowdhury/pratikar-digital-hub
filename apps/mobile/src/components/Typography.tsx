import type { ComponentProps } from "react";
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type StyleProp,
  type TextStyle,
} from "react-native";

import { fonts } from "@/lib/theme";

const FAMILY_FOR_WEIGHT: Record<string, string> = {
  "400": fonts.regular,
  normal: fonts.regular,
  "500": fonts.medium,
  "600": fonts.semibold,
  "700": fonts.bold,
  bold: fonts.bold,
  "800": fonts.extrabold,
  "900": fonts.extrabold,
};

/**
 * Android can't synthesise a weight for a custom font, so `fontWeight` is
 * turned into that weight's own family here, and every string in the app
 * gets the brand font without each screen having to ask.
 */
function withFont(style: StyleProp<TextStyle>): TextStyle {
  const { fontWeight, fontFamily, ...rest } = StyleSheet.flatten(style) ?? {};
  return {
    ...rest,
    fontFamily:
      fontFamily ??
      FAMILY_FOR_WEIGHT[String(fontWeight ?? "400")] ??
      fonts.regular,
  };
}

export function Text({ style, ...props }: ComponentProps<typeof RNText>) {
  return <RNText {...props} style={withFont(style)} />;
}

export function TextInput({
  style,
  ...props
}: ComponentProps<typeof RNTextInput>) {
  return <RNTextInput {...props} style={withFont(style)} />;
}
