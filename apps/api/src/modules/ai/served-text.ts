import type Anthropic from "@anthropic-ai/sdk";

/**
 * The text of the answer that was served. After a server-side fallback the
 * content holds the declining model's partial output, then a fallback
 * block, then the serving model's answer — only the last part is the draft.
 */
export function servedText(content: Anthropic.Beta.BetaContentBlock[]): string {
  let start = 0;
  content.forEach((block, index) => {
    if (block.type === "fallback") start = index + 1;
  });
  return content
    .slice(start)
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("");
}
