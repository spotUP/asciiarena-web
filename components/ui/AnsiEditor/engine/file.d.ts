export interface EncodeAnsOpts {
  title?: string;
  author?: string;
  group?: string;
  /**
   * Overrides the canvas's current iceColors setting in the SAUCE record.
   * Defaults to the canvas's current value when omitted.
   */
  iceColors?: boolean;
}

/**
 * Produces the ANSI body + 0x1a EOF marker + 128-byte SAUCE record.
 * Reads the current State.textArtCanvas content.
 */
export declare function encodeAnsBytes(
  opts?: EncodeAnsOpts
): Promise<Uint8Array>;

/** Decoded ANSI drawing. `data` is a flat Uint8Array of [char, fg, bg] triplets, row-major. */
export interface DecodedAnsi {
  width: number;
  height: number;
  data: Uint8Array;
  noblink: boolean;
  title: string;
  author: string;
  group: string;
  comments: string;
  fontName: string;
  letterSpacing: boolean;
}

/**
 * Pure ANSI decoder. Parses a `.ans` byte stream (body + optional SAUCE) back
 * into a drawing. Exposed for the round-trip interop test.
 */
export declare function loadAnsi(bytes: Uint8Array, isUTF8?: boolean): DecodedAnsi;

/** Full Load/Save namespace — not used by mount.ts but declared for completeness. */
export declare const Load: unknown;
export declare const Save: unknown;

// Default export is the legacy { Load, Save } object; prefer the named exports (incl. encodeAnsBytes).
declare const _default: { Load: typeof Load; Save: typeof Save };
export default _default;
