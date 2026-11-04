import * as Haptics from "expo-haptics";

import { IS_WEB } from "./platform";

/** A light tick for a deliberate tap. Never fails: it's a nicety. */
export function tapHaptic(): void {
  if (IS_WEB) return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
    () => undefined,
  );
}
