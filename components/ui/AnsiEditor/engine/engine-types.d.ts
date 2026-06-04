/**
 * Shared type definitions for the vendored text0wnz engine modules.
 *
 * Each engine module has a co-located .d.ts file (state.d.ts, canvas.d.ts,
 * etc.) that tsc prefers over inferring types from the .js source when
 * allowJs:true and checkJs:false are both in effect.
 *
 * Import these interfaces from this file to share them across declarations.
 */

/** The subset of the text-art canvas API used by mount.ts. */
export interface TextArtCanvas {
  /**
   * Async; loads the named font PNG, then calls `callback` once applied.
   * The optional `scaleFactor` parameter is unused by mount.ts.
   */
  setFont(fontName: string, callback: () => void): Promise<void>;
  resize(columns: number, rows: number): void;
  clear(): void;
  setIceColors(enabled: boolean): void;
  getColumns(): number;
  getRows(): number;
  getIceColors(): boolean;
  getCurrentFontName(): string;
  getImageData(): unknown;
}
