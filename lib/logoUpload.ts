// Server-side validation + encoding for an uploaded ANSI (.ans) site logo.
import { measureAnsi, checkLogoDims } from "@/lib/ansiDims";
import { ANSI_FONT_MAP } from "@/lib/ansilove";

const MAX_ANSI_BYTES = 256 * 1024;

export interface AnsiUpload {
  ansiB64: string;
  font: string | null; // AnsiLove preset (e.g. "topaz+"), or null = SAUCE/auto
}

// Validates size + header dimensions, then base64-encodes. Returns a rejection
// reason or the encoded upload. `fontValue` is the UI font name (FONTS value),
// mapped to the AnsiLove preset; null/unknown stores null (let SAUCE/auto pick).
export async function processAnsiUpload(
  file: File,
  fontValue: string | null,
): Promise<{ error: string } | { upload: AnsiUpload }> {
  if (file.size === 0) return { error: "The file is empty." };
  if (file.size > MAX_ANSI_BYTES) {
    return { error: `File too large (${Math.round(file.size / 1024)} KB); the limit is ${MAX_ANSI_BYTES / 1024} KB.` };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const reason = checkLogoDims(measureAnsi(bytes));
  if (reason) return { error: reason };
  const ansiB64 = Buffer.from(bytes).toString("base64");
  const font = fontValue && ANSI_FONT_MAP[fontValue] ? ANSI_FONT_MAP[fontValue] : null;
  return { upload: { ansiB64, font } };
}
