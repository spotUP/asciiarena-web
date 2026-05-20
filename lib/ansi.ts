// CGA/ANSI 8-color palette matching the site's retro aesthetic
const ANSI_COLORS: Record<string, string> = {
  "0":  "",         // reset
  "30": "#111111",  // black
  "31": "#ff5555",  // red
  "32": "#55ff55",  // green
  "33": "#ffff55",  // yellow
  "34": "#5555ff",  // blue
  "35": "#ff55ff",  // magenta
  "36": "#55ffff",  // cyan
  "37": "#aaaaaa",  // white/grey
};

function escapeHtml(s: string): string {
  return s
    .replace(/&(?!#?\w+;)/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#91;/g, "[")
    .replace(/&#44;/g, ",")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/**
 * Convert ANSI color escape codes to HTML <span> elements.
 * Handles: [Nm  \x1b[Nm  [Nm  (with/without ESC, with HTML-encoded bracket)
 */
export function ansiToHtml(raw: string): string {
  const text = decodeHtmlEntities(raw);
  // Split on ESC[Nm or bare [Nm sequences
  const parts = text.split(/(?:|\x1b)?\[(\d+)m/);
  let html = "";
  let open = false;

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      html += escapeHtml(parts[i]);
    } else {
      if (open) { html += "</span>"; open = false; }
      const color = ANSI_COLORS[parts[i]];
      if (color) { html += `<span style="color:${color}">`; open = true; }
    }
  }
  if (open) html += "</span>";
  return html;
}
