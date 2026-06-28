// Shared loader + font maps for the vendored AnsiLove.js (assets/js/ansilove.js).
// Browser-only — call these from client components. AnsiLove.js is ~276KB, so it
// is injected lazily on first use and shared across the page (logo header +
// release/colly viewer) via the memoized promise below.

export interface AnsiLoveController {
  play: (baud: number, callback?: () => void, clearScreen?: boolean) => void;
  stop: () => void;
  load: (url: string, callback?: (sauce: unknown) => void, callbackFail?: () => void) => void;
}

export interface AnsiLoveApi {
  render: (
    url: string,
    cb: (canvas: HTMLCanvasElement) => void,
    opts: Record<string, unknown>,
    fail?: () => void,
  ) => void;
  splitRender: (
    url: string,
    cb: (canvases: HTMLCanvasElement[]) => void,
    chunkSize: number,
    opts: Record<string, unknown>,
    fail?: () => void,
  ) => void;
  renderBytes: (
    bytes: Uint8Array,
    cb: (canvas: HTMLCanvasElement) => void,
    opts: Record<string, unknown>,
    fail?: () => void,
  ) => void;
  animate: (
    url: string,
    cb: (canvas: HTMLCanvasElement, sauce: unknown) => void,
    opts: Record<string, unknown>,
    fail?: () => void,
  ) => AnsiLoveController;
  animateBytes: (
    bytes: Uint8Array,
    cb: (canvas: HTMLCanvasElement, sauce: unknown) => void,
    opts: Record<string, unknown>,
  ) => AnsiLoveController;
}

const SCRIPT_SRC = "/assets/js/ansilove.js";
let loadPromise: Promise<AnsiLoveApi> | null = null;

// Inject AnsiLove.js once and resolve when `window.AnsiLove` is available.
// Memoized so concurrent callers share a single load, and reuses an existing
// <script> tag if another part of the page (e.g. the release viewer) added it.
export function loadAnsiLove(): Promise<AnsiLoveApi> {
  if (typeof window === "undefined") return Promise.reject(new Error("ansilove: not in browser"));
  if (loadPromise) return loadPromise;
  loadPromise = new Promise<AnsiLoveApi>((resolve, reject) => {
    const w = window as Window & { AnsiLove?: AnsiLoveApi };
    if (w.AnsiLove) { resolve(w.AnsiLove); return; }
    if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.onerror = () => reject(new Error("ansilove: script failed to load"));
      document.head.appendChild(script);
    }
    let tries = 0;
    const poll = () => {
      if (w.AnsiLove) { resolve(w.AnsiLove); return; }
      if (++tries > 200) { reject(new Error("ansilove: load timeout")); return; } // ~10s
      setTimeout(poll, 50);
    };
    poll();
  });
  return loadPromise;
}

// UI font choices (label) ↔ AnsiLove font preset (value via ANSI_FONT_MAP).
export const FONTS = [
  { value: "MicroKnight", label: "MicroKnight" },
  { value: "MicroKnightPlus", label: "MicroKnight+" },
  { value: "mOsOul", label: "mOsOul" },
  { value: "P0T-NOoDLE", label: "P0T-NOoDLE" },
  { value: "Topaz_a500", label: "A500 Topaz" },
  { value: "TopazPlus_a500", label: "A500 Topaz+" },
  { value: "Topaz_a1200", label: "A1200 Topaz" },
  { value: "TopazPlus_a1200", label: "A1200 Topaz+" },
];

export const ANSI_FONT_MAP: Record<string, string> = {
  "MicroKnight": "microknight",
  "MicroKnightPlus": "microknight+",
  "mOsOul": "mosoul",
  "P0T-NOoDLE": "pot-noodle",
  "Topaz_a500": "topaz500",
  "TopazPlus_a500": "topaz500+",
  "Topaz_a1200": "topaz",
  "TopazPlus_a1200": "topaz+",
};
