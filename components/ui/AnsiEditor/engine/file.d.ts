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

/**
 * The Load namespace. Only the members the embed actually calls are typed.
 *
 * The two font-name tables are the interesting part: a `.ans` file's SAUCE
 * records the SAUCE name ("Amiga Topaz 2+") while the engine's font PNGs are
 * named after the app font ("Topaz+ 1200 8x16"), so anything that loads a file
 * has to translate before asking for the image.
 */
export interface LoadNamespace {
  /** SAUCE font name -> app font name. Null when the name is not known. */
  sauceToAppFont: (sauceFontName: string) => string | null;
  /** App font name -> SAUCE font name. Null when there is no SAUCE equivalent. */
  appToSauceFont: (appFontName: string) => string | null;
  loadAnsi: typeof loadAnsi;
}

export declare const Load: LoadNamespace;
export declare const Save: unknown;

// Default export is the legacy { Load, Save } object; prefer the named exports (incl. encodeAnsBytes).
declare const _default: { Load: typeof Load; Save: typeof Save };
export default _default;
