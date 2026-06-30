import { readFileSync, existsSync } from "fs";
import path from "path";
import { encodeReleaseText, releaseTextEncoding, stripFileIdDiz } from "@/lib/releaseText";

// Resolve a colly's on-disk path the same way the release page does:
// <COLLECTIONS_PATH>/<filename-without-ext>/<filename>.
export function collyFilePath(filename: string): string {
  const collectionsPath = process.env.COLLECTIONS_PATH ?? path.join(process.cwd(), "collections");
  const dirname = filename.replace(/\.[^.]+$/, "");
  return path.join(collectionsPath, dirname, filename);
}

// Strip CSI escape sequences (ANSI colour codes) so logo-section detection sees
// the underlying characters, not escape bytes. The release page converts these
// to HTML spans for display; the indexer wants plaintext.
function stripAnsiEscapes(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, "");
}

// Decoded plaintext of a colly — diz-stripped and ANSI-escape-stripped — suitable
// for detectLogoSections / label extraction. Reuses the same decoders as the
// release viewer (lib/releaseText) so encoding matches what users see. Returns
// null if the file is missing or unreadable. Reads only; nothing is persisted.
export function readCollyText(filename: string, storedType?: string | null): string | null {
  const filePath = collyFilePath(filename);
  if (!existsSync(filePath)) return null;
  try {
    const encoding = releaseTextEncoding((storedType ?? "ASCII").toUpperCase(), null);
    let text = encodeReleaseText(readFileSync(filePath), encoding);
    text = stripFileIdDiz(text).content;
    text = stripAnsiEscapes(text);
    return text;
  } catch {
    return null;
  }
}
