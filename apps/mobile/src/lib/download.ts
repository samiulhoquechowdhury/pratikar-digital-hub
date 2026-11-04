import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { IS_WEB } from "./platform";

/**
 * Saves a file from a short-lived signed URL into the app's documents and
 * opens the share sheet, so the customer can keep it — in Files, Drive,
 * WhatsApp, wherever. A one-time document download is spent by the API
 * call that minted the URL, so the file is kept on the phone as well.
 */
export async function saveAndShare(url: string, fileName: string) {
  // In the browser preview the browser saves it, as on the website.
  if (IS_WEB) {
    window.open(url, "_blank", "noopener");
    return url;
  }
  const safeName = fileName.replace(/[^\w.\- ]+/g, "").trim() || "document";
  const target = new File(Paths.document, safeName);
  if (target.exists) target.delete();
  const file = await File.downloadFileAsync(url, target);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { dialogTitle: safeName });
  }
  return file.uri;
}
