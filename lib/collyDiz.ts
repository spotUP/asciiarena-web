import { readFileSync, existsSync } from "fs";
import { collyFilePath } from "@/lib/collyText";
import { parseCollyBytes } from "@/lib/collyTrailer";
import { decodeReleaseText, stripFileIdDiz, releaseTextEncoding, escapeHtmlText } from "@/lib/releaseText";

// Strip full ANSI/CSI sequences + remaining control chars (incl. a bare ESC).
function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
}

const nl = (s: string) => s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
const clean = (s: string) => escapeHtmlText(stripAnsi(nl(s)));

/** A colly's preview text for cards/heroes — the same diz the release page shows:
 *  a separate .diz, else the embedded @BEGIN_FILE_ID.DIZ block, else a snippet of
 *  the art. ANSI codes are stripped (plain <pre> contexts). Null if nothing. */
export function readCollyDiz(filename: string, storedType?: string | null): string | null {
  const enc = releaseTextEncoding((storedType ?? "ASCII").toUpperCase(), null);
  const collyPath = collyFilePath(filename);
  if (!collyPath) return null;
  const dizPath = `${collyPath}.diz`;

  // 1. separate .diz file
  if (existsSync(dizPath)) {
    try {
      const t = clean(decodeReleaseText(new Uint8Array(readFileSync(dizPath)), enc));
      if (t.trim()) return t;
    } catch { /* fall through */ }
  }

  if (!existsSync(collyPath)) return null;
  try {
    const { visible } = parseCollyBytes(new Uint8Array(readFileSync(collyPath)));
    const decoded = decodeReleaseText(visible, enc);
    const stripped = stripFileIdDiz(decoded);
    // 2. embedded @BEGIN_FILE_ID.DIZ block
    if (stripped.dizText && stripped.dizText.trim()) return clean(stripped.dizText);
    // 3. snippet of the art
    const lines = stripAnsi(nl(stripped.content)).split("\n").filter((l) => l.trim()).slice(0, 16).map((l) => (l.length > 80 ? l.slice(0, 80) : l));
    return lines.length ? escapeHtmlText(lines.join("\n")) : null;
  } catch {
    return null;
  }
}
