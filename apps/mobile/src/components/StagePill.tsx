import { Pill } from "@/components/ui";
import type { StageTone } from "@/features/documents/documentStage";

/** documentStage's tones, in the app's pill colours. */
const TONE = {
  warning: "warning",
  success: "success",
  neutral: "neutral",
  brand: "gold",
  danger: "danger",
} as const satisfies Record<StageTone, Parameters<typeof Pill>[0]["tone"]>;

export function StagePill({ label, tone }: { label: string; tone: StageTone }) {
  return <Pill label={label} tone={TONE[tone]} />;
}
