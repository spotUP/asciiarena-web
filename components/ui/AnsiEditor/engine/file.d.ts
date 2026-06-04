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

/** Full Load/Save namespace — not used by mount.ts but declared for completeness. */
export declare const Load: unknown;
export declare const Save: unknown;

declare const _default: { Load: typeof Load; Save: typeof Save };
export default _default;
