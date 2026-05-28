// Classic 16-colour CGA / ANSI palette, mirroring the saturated tones the
// site uses for its colour classes (`.magenta`, `.lightcyan`, `.yellow`, …
// defined in assets/css/site.css). Index 0–7 = standard, 8–15 = bright.
// These are the only colours allowed for ANSI rendering on this site.

export const ANSI_PALETTE: readonly string[] = [
  "#000000", // 0  black
  "#aa0000", // 1  red
  "#00aa00", // 2  green
  "#aa5500", // 3  brown / dark yellow
  "#0000aa", // 4  blue
  "#aa00aa", // 5  magenta
  "#00aaaa", // 6  cyan
  "#aaaaaa", // 7  light grey
  "#555555", // 8  dark grey  (bright black)
  "#ff5555", // 9  light red
  "#55ff55", // 10 light green
  "#ffff55", // 11 yellow
  "#5555ff", // 12 light blue
  "#ff55ff", // 13 light magenta
  "#55ffff", // 14 light cyan
  "#ffffff", // 15 white
];

export const ANSI_PALETTE_LABELS: readonly string[] = [
  "Black", "Red", "Green", "Brown", "Blue", "Magenta", "Cyan", "Light Grey",
  "Dark Grey", "Light Red", "Light Green", "Yellow",
  "Light Blue", "Light Magenta", "Light Cyan", "White",
];

export function colorOf(idx: number): string {
  return ANSI_PALETTE[((idx % 16) + 16) % 16];
}

// Darker variant of a palette colour, used for the bar's "tail" cell so the
// ASCII fill char (`.` `:` `-` `=`) stays legible. Calculated once at module
// load — a 60%-darker version of each base colour.
function dim(hex: string, factor = 0.45): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 0xff) * factor);
  const g = Math.round(((n >> 8) & 0xff) * factor);
  const b = Math.round((n & 0xff) * factor);
  return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
}

export const ANSI_PALETTE_DIM: readonly string[] = ANSI_PALETTE.map(c => dim(c));

export function dimColorOf(idx: number): string {
  return ANSI_PALETTE_DIM[((idx % 16) + 16) % 16];
}
