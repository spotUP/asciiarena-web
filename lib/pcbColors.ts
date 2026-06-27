/**
 * PCB (PCBoard) BBS colour-code converter for ASCII art releases.
 *
 * Format: @X followed by two hex digits — first = background colour index,
 * second = foreground colour index. Uses the standard 16-colour EGA/VGA
 * palette that PCBoard / Renegade / Wildcat / Telegard BBSes used.
 *
 * Example:
 *   @X03hello  →  <span style="color:#00AAAA;background:#000000">hello</span>
 *   @X3Bworld  →  <span style="color:#55FFFF;background:#00AAAA">world</span>
 *
 * Safe to call on already-HTML-escaped text: @, X, and hex digits are never
 * HTML-escaped, so @Xnn sequences survive escapeHtmlText() intact.
 */

const PCB_COLORS: Record<string, string> = {
  "0": "#000000", // Black
  "1": "#0000AA", // Blue
  "2": "#00AA00", // Green
  "3": "#00AAAA", // Cyan
  "4": "#AA0000", // Red
  "5": "#AA00AA", // Magenta
  "6": "#AA5500", // Brown
  "7": "#AAAAAA", // Light Grey
  "8": "#555555", // Dark Grey
  "9": "#5555FF", // Bright Blue
  A: "#55FF55", // Bright Green
  B: "#55FFFF", // Bright Cyan
  C: "#FF5555", // Bright Red
  D: "#FF55FF", // Bright Magenta
  E: "#FFFF55", // Bright Yellow
  F: "#FFFFFF", // Bright White
};

/**
 * Convert PCB @X colour codes in already-HTML-escaped text to <span> tags.
 *
 * Each @Xbgfg sequence opens a new <span> with the corresponding colour and
 * background. A previous span (if any) is closed first. A final </span> is
 * appended if any colour spans were opened.
 *
 * Returns the input unchanged if no @X codes are present.
 */
export function convertPcbColors(html: string): string {
  // Quick-reject: skip the regex if there are no @X codes at all.
  if (html.indexOf("@X") === -1) return html;

  let open = false;
  const result = html.replace(
    /@X([0-9A-Fa-f])([0-9A-Fa-f])/g,
    (_match, bgHex: string, fgHex: string) => {
      const bg = PCB_COLORS[bgHex.toUpperCase()] ?? "#000000";
      const fg = PCB_COLORS[fgHex.toUpperCase()] ?? "#AAAAAA";
      const close = open ? "</span>" : "";
      open = true;
      return `${close}<span style="color:${fg};background-color:${bg}">`;
    },
  );

  return open ? result + "</span>" : result;
}

/**
 * Return true if the text contains any PCB @X colour codes.
 */
export function hasPcbCodes(text: string): boolean {
  return /@X[0-9A-Fa-f]{2}/.test(text);
}
