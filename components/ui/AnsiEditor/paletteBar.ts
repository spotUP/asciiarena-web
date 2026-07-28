/**
 * paletteBar — asciiarena CHANGE 3.
 *
 * The text0wnz engine ships a canvas-based palette picker (#palettePicker) laid
 * out as 2 columns x 8 rows in the left sidebar. asciiarena wants the 16 colours
 * as a 2-rows x 8-columns block ABOVE the canvas instead.
 *
 * Rather than rewrite the engine's canvas draw + pixel hit-test, we hide that
 * canvas (in CSS) and build our own 16-swatch HTML grid here, wiring each swatch
 * to the SAME engine setters the canvas picker used:
 *   - left-click  -> State.palette.setForegroundColor(index)
 *   - right-click -> State.palette.setBackgroundColor(index)
 * and we mirror the engine's fg/bg state by listening to the same custom events
 * it dispatches (onForegroundChange / onBackgroundChange / onPaletteChange), so
 * drawing always uses the picked colour and the bar stays in sync if the colour
 * is changed by keyboard, file load, or palette edit.
 *
 * No engine .js is modified — this is pure DOM glue over the public palette API.
 */

export interface PaletteApi {
  getRGBAColor: (index: number) => Uint8Array | number[];
  getForegroundColor: () => number;
  getBackgroundColor: () => number;
  setForegroundColor: (index: number) => void;
  setBackgroundColor: (index: number) => void;
}

interface PaletteBarHandle {
  destroy: () => void;
}

const css = (rgba: Uint8Array | number[]): string =>
  `rgb(${rgba[0]}, ${rgba[1]}, ${rgba[2]})`;

/**
 * Build the 2x8 swatch grid inside `root` (the .ansi-editor-root wrapper) and
 * wire it to the engine palette. Returns a handle whose destroy() detaches the
 * document-level event listeners so a remount (React StrictMode) is clean.
 */
export function initPaletteBar(
  root: HTMLElement,
  getPalette: () => PaletteApi | null
): PaletteBarHandle {
  // Read the palette on every use, never capture it.
  //
  // "Clear canvas" (the engine's `new`) does `State.palette =
  // createDefaultPalette()`, replacing the object outright. A captured
  // reference keeps driving the DISCARDED palette after that: the swatches and
  // chips still respond, so the bar looks fine, while the engine draws with a
  // palette nobody is setting. That is what made picking a background colour
  // silently stop working after a clear.
  const palette: PaletteApi = {
    getRGBAColor: i => getPalette()?.getRGBAColor(i) ?? [0, 0, 0, 255],
    getForegroundColor: () => getPalette()?.getForegroundColor() ?? 7,
    getBackgroundColor: () => getPalette()?.getBackgroundColor() ?? 0,
    setForegroundColor: i => getPalette()?.setForegroundColor(i),
    setBackgroundColor: i => getPalette()?.setBackgroundColor(i),
  };
  const swatchHost = root.querySelector<HTMLElement>("#paletteSwatches");
  const fgChip = root.querySelector<HTMLElement>("#paletteFgChip");
  const bgChip = root.querySelector<HTMLElement>("#paletteBgChip");

  if (!swatchHost || !fgChip || !bgChip) {
    // Markup missing — nothing to wire. Return a no-op handle.
    return { destroy: () => {} };
  }

  const swatches: HTMLButtonElement[] = [];

  for (let i = 0; i < 16; i++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "paletteSwatch";
    btn.dataset.index = String(i);
    btn.style.backgroundColor = css(palette.getRGBAColor(i));
    btn.setAttribute(
      "aria-label",
      `Colour ${i} — left-click foreground, right-click background`
    );

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      palette.setForegroundColor(i);
    });
    btn.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      palette.setBackgroundColor(i);
    });

    swatchHost.appendChild(btn);
    swatches.push(btn);
  }

  const refreshColours = () => {
    for (let i = 0; i < 16; i++) {
      swatches[i].style.backgroundColor = css(palette.getRGBAColor(i));
    }
  };

  const refreshSelection = () => {
    const fg = palette.getForegroundColor();
    const bg = palette.getBackgroundColor();
    for (let i = 0; i < 16; i++) {
      swatches[i].classList.toggle("isFg", i === fg);
      swatches[i].classList.toggle("isBg", i === bg);
    }
    fgChip.style.backgroundColor = css(palette.getRGBAColor(fg));
    bgChip.style.backgroundColor = css(palette.getRGBAColor(bg));
  };

  const onPaletteChange = () => {
    refreshColours();
    refreshSelection();
  };

  document.addEventListener("onForegroundChange", refreshSelection);
  document.addEventListener("onBackgroundChange", refreshSelection);
  document.addEventListener("onPaletteChange", onPaletteChange);

  // Initial paint.
  refreshSelection();

  return {
    destroy: () => {
      document.removeEventListener("onForegroundChange", refreshSelection);
      document.removeEventListener("onBackgroundChange", refreshSelection);
      document.removeEventListener("onPaletteChange", onPaletteChange);
    },
  };
}
