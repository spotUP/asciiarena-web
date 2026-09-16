// CP437 encoder for BBS text ads: the database stores decoded Unicode,
// AnsiLove renders raw bytes. ASCII round-trips exactly; box drawing maps
// back to its byte; anything outside CP437 becomes "?" (same convention as
// the doorserver importer). Pure, unit-tested.
const HIGH =
  "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»" +
  "░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀" +
  "αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ";

const TABLE = new Map<string, number>();
for (let i = 0; i < HIGH.length; i++) TABLE.set(HIGH[i], 0x80 + i);

export function encodeCp437(text: string): Uint8Array {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const code = ch.charCodeAt(0);
    if (code < 0x80) {
      out[i] = code;
    } else {
      out[i] = TABLE.get(ch) ?? 0x3f; // "?"
    }
  }
  return out;
}

export function toBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  if (typeof btoa !== "undefined") return btoa(bin);
  return Buffer.from(bin, "binary").toString("base64");
}

/** True when the text carries ANSI escape sequences worth rendering. */
export function hasAnsi(text: string): boolean {
  return /\x1b\[[0-9;]*[A-Za-z]/.test(text);
}
