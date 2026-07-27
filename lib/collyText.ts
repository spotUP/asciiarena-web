import { readFileSync, existsSync } from "fs";
import path from "path";
import { decodeReleaseText, releaseTextEncoding, stripFileIdDiz } from "@/lib/releaseText";
import { parseCollyBytes } from "@/lib/collyTrailer";

// Resolve a colly's on-disk path the same way the release page does:
// <COLLECTIONS_PATH>/<filename-without-ext>/<filename>.
// Returns null if the resolved path escapes the collections directory.
export function collyFilePath(filename: string): string | null {
  // Reject filenames containing null bytes or absolute paths.
  if (filename.includes("\x00") || path.isAbsolute(filename)) return null;

  const collectionsPath = path.resolve(process.env.COLLECTIONS_PATH ?? path.join(process.cwd(), "collections"));
  const dirname = filename.replace(/\.[^.]+$/, "");
  const candidate = path.resolve(path.join(collectionsPath, dirname, filename));

  // Verify the resolved path is inside the collections directory.
  // Use path.relative to check if the path escapes: if it starts with "..",
  // it is outside the root.
  const relative = path.relative(collectionsPath, candidate);
  if (relative.startsWith("..")) return null;

  return candidate;
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
  if (!filePath || !existsSync(filePath)) return null;
  try {
    const encoding = releaseTextEncoding((storedType ?? "ASCII").toUpperCase(), null);
    // Drop the invisible metadata trailer (after Ctrl-Z) so logo detection / the
    // search catalog never see SAUCE bytes or key:value tag lines.
    const { visible } = parseCollyBytes(readFileSync(filePath));
    // Decode with the ESC byte INTACT, strip ANSI sequences in full, THEN drop
    // control chars — doing it the other way (encodeReleaseText first) removes the
    // ESC and leaves bare "[1m" fragments behind.
    let text = decodeReleaseText(visible, encoding);
    text = stripFileIdDiz(text).content;
    text = stripAnsiEscapes(text);
    text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
    return text;
  } catch {
    return null;
  }
}
