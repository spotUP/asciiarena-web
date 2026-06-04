# ANSI Logo Editor — Implementation Plan (Phase 1: embedded solo editor)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Embed a deep-forked text0wnz ANSI editor as a native React component on the Submit Logo tab, locked to 80×8 with the Topaz+ font, producing `.ans` bytes that flow through the existing ANSI logo pipeline.

**Architecture:** Vendor text0wnz's vanilla-JS engine modules into `components/ui/AnsiEditor/engine/`, give them the `init(container)` entry point and headless byte-export they lack, and wrap them in a React `<AnsiEditor>` that owns mount/unmount and exposes `getAnsiBytes()`. The submit page POSTs those bytes to the existing multipart `/api/logos` branch — no new API, no schema change.

**Tech Stack:** Next.js 16 / React (client component), TypeScript, vendored text0wnz (MIT, vanilla JS + `<canvas>` + bitmap fonts), Vitest. Spec: `docs/superpowers/specs/2026-06-04-ansi-logo-editor-design.md`.

**Reference (cloned upstream):** `/tmp/text0wnz` (re-clone with `git clone --depth 1 https://github.com/xero/moebius-web.git /tmp/text0wnz` if gone). Key upstream symbols already located:
- `src/js/client/canvas.js:8` `createTextArtCanvas(canvasContainer, callback)` (exported `:1989`); cell model `imageData[y*cols+x] = char<<8 | bg<<4 | fg` (`:1114`); `resize(cols,rows)` `:885`; `getImageData/getColumns/getRows/getIceColors/setIceColors/setFont/clear/getCurrentFontName`.
- `src/js/client/state.js` — `State` singleton; Vite env reads at `:92-96` (`BASE_URL`, `VITE_UI_DIR`, `VITE_FONT_DIR`, `VITE_WORKER_FILE`) set `fontDir`/`uiDir`/`workerPath`. **Only coupling to Vite.**
- `src/js/client/palette.js:304` `createDefaultPalette()`.
- `src/js/client/file.js:1355` `encodeANSi(useUTF8, blinkers, stripEscapeCodes)` builds the `.ans` `Uint8Array` then calls `saveFile()` (download); `:1230` `createSauce(...)`; `:226` `loadAnsi(bytes)`.
- Font asset: upstream `src/fonts/Topaz+ 1200 8x16.png`.

---

## Scope & honesty note

Phase 1 below (Tasks 1–8) is the **de-risking vertical slice**: prove the vendored engine renders an 80×8 Topaz+ canvas inside a React div, round-trips a cell buffer to/from `.ans` bytes, and submits through the existing pipeline — with **no toolbar UI yet** (cells set programmatically/by keyboard only). It is fully specified and produces working, testable software on its own.

Phases 2–4 (toolbar/tools UI, CSS de-full-screening, collab stripping, polish) are a **roadmap with deliverables and acceptance criteria**, intentionally not pre-written as bite-sized code: porting text0wnz's 73-DOM-id UI and de-full-screening its CSS is fork-discovery work whose exact edits are only knowable while doing them. **After Phase 1 lands, re-run writing-plans to expand Phase 2 into bite-sized tasks from the real code.** Do not fabricate that code now.

---

## File structure (Phase 1)

- Create `components/ui/AnsiEditor/engine/` — vendored text0wnz client modules needed for **render + export** (canvas, state, palette, font, fontCache, lazyFont, magicNumbers, file, compression, and their transitive deps), plus upstream `LICENSE.txt`. Responsibility: the drawing/export engine, edited only where embedding requires.
- Create `components/ui/AnsiEditor/engine/env.ts` — replaces text0wnz's `import.meta.env` reads with a typed config (font dir under our `public/`). Responsibility: decouple the engine from Vite.
- Create `components/ui/AnsiEditor/mount.ts` — `initAnsiEditor(container, opts): EditorHandle`. Responsibility: build the editor DOM inside `container`, configure 80×8 + Topaz+, return `{ getAnsiBytes, loadAnsiBytes, destroy }`.
- Create `components/ui/AnsiEditor/AnsiEditor.tsx` — React wrapper. Responsibility: mount/unmount lifecycle + `useImperativeHandle` exposing `getAnsiBytes()`.
- Create `public/ansi-editor/fonts/Topaz+ 1200 8x16.png` — the font asset.
- Create `lib/__tests__/ansi-editor-roundtrip.test.ts` — the interop guard.
- Modify `app/submit/SubmitClient.tsx` — replace the ASCII textarea block with `<AnsiEditor>`, keep the `.ans` upload, submit via `getAnsiBytes()`.

---

## Task 1: Re-clone upstream and inventory the render+export dependency graph

**Files:** none yet (investigation).

- [ ] **Step 1:** `git clone --depth 1 https://github.com/xero/moebius-web.git /tmp/text0wnz` (skip if present).
- [ ] **Step 2:** Starting from `src/js/client/canvas.js`, `state.js`, `palette.js`, `font.js`, `file.js`, follow `import` statements transitively and list **every** client module reachable from render + export (exclude `network.js`, `websocket.js`, and any chat/collab module). Record the list in the PR description / a scratch note.
- [ ] **Step 3:** Confirm none of the render/export modules import `network.js`/`websocket.js`. If one does, note the exact import to stub in Task 3.

Verification: a written module list; `grep -l "network.js\|websocket.js"` over the render/export set is empty (or the offenders are noted).

---

## Task 2: Vendor the engine modules + license + font asset

**Files:**
- Create: `components/ui/AnsiEditor/engine/*.js` (the modules from Task 1)
- Create: `components/ui/AnsiEditor/engine/LICENSE.txt` (copied from upstream `LICENSE.txt` — MIT requires retaining it)
- Create: `public/ansi-editor/fonts/Topaz+ 1200 8x16.png`

- [ ] **Step 1:** Copy each module from Task 1's list into `components/ui/AnsiEditor/engine/`, preserving relative import paths (they import each other by `./name.js`).
- [ ] **Step 2:** Copy upstream `LICENSE.txt` to `components/ui/AnsiEditor/engine/LICENSE.txt`.
- [ ] **Step 3:** `cp "/tmp/text0wnz/src/fonts/Topaz+ 1200 8x16.png" "public/ansi-editor/fonts/Topaz+ 1200 8x16.png"`.
- [ ] **Step 4:** `npx tsc --noEmit` — expect it to PASS (these are `.js`, not type-checked) but the import graph must resolve. Fix any missing transitive module by vendoring it too.
- [ ] **Step 5:** Commit: `git add components/ui/AnsiEditor/engine public/ansi-editor && git commit -m "vendor text0wnz render/export engine + Topaz+ font (MIT)"`.

Verification: all engine imports resolve; LICENSE present; font served at `/ansi-editor/fonts/Topaz+ 1200 8x16.png` (check via `next dev` + curl).

---

## Task 3: Decouple the engine from Vite (`import.meta.env`) and stub collab

**Files:**
- Create: `components/ui/AnsiEditor/engine/env.ts`
- Modify: `components/ui/AnsiEditor/engine/state.js` (lines around `:92-96`)

- [ ] **Step 1:** Create `engine/env.ts`:

```ts
// Replaces text0wnz's Vite import.meta.env reads. Fonts are served from public/.
export const ENGINE_ENV = {
  urlPrefix: "",
  uiDir: "/ansi-editor/",
  fontDir: "/ansi-editor/fonts/",
  workerPath: "", // collab worker disabled in phase 1
};
```

- [ ] **Step 2:** In `engine/state.js`, replace the four `import.meta.env.*` reads (`:92-96`) with values from `ENGINE_ENV` (add `import { ENGINE_ENV } from "./env.ts";` — or `.js` per the vendored extension convention). Set `this.urlPrefix = ENGINE_ENV.urlPrefix; this.uiDir = ENGINE_ENV.uiDir; this.fontDir = ENGINE_ENV.fontDir; this.workerPath = ENGINE_ENV.workerPath;`.
- [ ] **Step 3:** If Task 1.3 found a collab import in a render/export module, replace that import with a no-op stub (e.g. `const network = { sendResize() {}, sendDraw() {} };`) so the module loads without the websocket layer.
- [ ] **Step 4:** Commit: `git commit -am "engine: replace Vite env with ENGINE_ENV config; stub collab"`.

Verification: no remaining `import.meta.env` in `engine/` (`grep -rn import.meta.env components/ui/AnsiEditor/engine` is empty).

---

## Task 4: Add headless `.ans` byte export (split serialization from download)

**Files:**
- Modify: `components/ui/AnsiEditor/engine/file.js` (around `encodeANSi` `:1355` and `saveFile`)

- [ ] **Step 1:** Read `encodeANSi(useUTF8, blinkers, stripEscapeCodes)` end to end. It assembles the ANSI body and a SAUCE record, then hands them to `saveFile()` for download. Extract the assembly into a new exported function that **returns the bytes** instead of downloading:

```js
// Returns the full .ans byte stream (body + SAUCE + EOF) without downloading.
// title/author come from args, NOT the DOM #sauceTitle inputs, so it works headless.
export async function encodeAnsBytes({ title = "", author = "", group = "", iceColors = true } = {}) {
  // ... the exact body of encodeANSi up to where it calls saveFile(),
  // using createSauce(...) with the args above instead of $('sauceTitle').value etc.,
  // returning the assembled Uint8Array.
}
```

Keep the existing `encodeANSi`/`Save.ans` download path working by having it call `encodeAnsBytes` then `saveFile`. (Exact line ranges are read during execution; the transformation is: move the pre-`saveFile` assembly into `encodeAnsBytes`, parameterize the SAUCE source.)
- [ ] **Step 2:** Ensure `createSauce` can take title/author/group/iceColors as args rather than reading DOM (add optional params defaulting to the current DOM reads so the in-app download path is unchanged).
- [ ] **Step 3:** `npx tsc --noEmit` passes.
- [ ] **Step 4:** Commit: `git commit -am "engine/file: add headless encodeAnsBytes() returning .ans Uint8Array"`.

Verification: `encodeAnsBytes` exists and returns a `Uint8Array`; the in-app download path still compiles.

---

## Task 5: `mount.ts` — embeddable init returning an EditorHandle

**Files:**
- Create: `components/ui/AnsiEditor/mount.ts`

- [ ] **Step 1:** Write `initAnsiEditor`:

```ts
import State from "./engine/state.js";
import { createTextArtCanvas } from "./engine/canvas.js";
import { createDefaultPalette } from "./engine/palette.js";
import { encodeAnsBytes } from "./engine/file.js";

export interface EditorHandle {
  getAnsiBytes: () => Promise<Uint8Array>;
  loadAnsiBytes: (bytes: Uint8Array) => void;
  destroy: () => void;
}

export interface EditorOpts { columns?: number; rows?: number; font?: string; iceColors?: boolean; onReady?: () => void; }

export function initAnsiEditor(container: HTMLElement, opts: EditorOpts = {}): EditorHandle {
  const columns = opts.columns ?? 80;
  const rows = opts.rows ?? 8;
  const font = opts.font ?? "Topaz+ 1200 8x16";
  const iceColors = opts.iceColors ?? true;

  const canvasContainer = document.createElement("div");
  container.appendChild(canvasContainer);

  State.palette = createDefaultPalette();
  State.textArtCanvas = createTextArtCanvas(canvasContainer, async () => {
    await State.textArtCanvas.setFont(font, () => {
      State.textArtCanvas.resize(columns, rows);
      State.textArtCanvas.clear();
      State.textArtCanvas.setIceColors(iceColors);
      opts.onReady?.();
    });
  });

  return {
    getAnsiBytes: () => encodeAnsBytes({ iceColors }),
    loadAnsiBytes: () => { /* phase 1: stub; wire to engine loadAnsi in Phase 2 */ },
    destroy: () => { container.replaceChildren(); /* listener teardown added in Phase 2 */ },
  };
}
```

- [ ] **Step 2:** `npx tsc --noEmit` passes (add `// @ts-expect-error` only where the untyped engine modules cross the boundary; prefer a small `engine/types.d.ts` declaring `State`, `createTextArtCanvas`, `createDefaultPalette`, `encodeAnsBytes`).
- [ ] **Step 3:** Commit: `git commit -am "AnsiEditor: initAnsiEditor mount returning EditorHandle"`.

Verification: `tsc` clean; `initAnsiEditor` exported with the `EditorHandle` interface.

---

## Task 6: Round-trip interop test (the critical guard)

**Files:**
- Create: `lib/__tests__/ansi-editor-roundtrip.test.ts`

- [ ] **Step 1:** Write the failing test — construct a known 80×8 cell buffer in the engine's `Uint16Array` format, encode via `encodeAnsBytes`, assert `measureAnsi` reports ≤80×8, and re-parse via the engine's `loadAnsi` to get back an identical buffer:

```ts
import { describe, it, expect } from "vitest";
import { measureAnsi, checkLogoDims } from "@/lib/ansiDims";
// import the engine encode/decode (jsdom env; see vitest config note below)

describe("ANSI editor byte round-trip", () => {
  it("encodes an 80x8 buffer to .ans within the limit and decodes back identically", async () => {
    // build a buffer: a couple of colored cells, rest blanks
    // bytes = await encodeAnsBytes({...})
    // expect(checkLogoDims(measureAnsi(bytes))).toBeNull();
    // const reparsed = loadAnsi(bytes); expect(reparsed.data).toEqual(buffer);
  });
});
```

- [ ] **Step 2:** Run `npx vitest run lib/__tests__/ansi-editor-roundtrip.test.ts` — expect FAIL (engine not wired / canvas needs DOM).
- [ ] **Step 3:** Make it pass: the engine touches the DOM/`<canvas>`, so run this test under jsdom. Add a `// @vitest-environment jsdom` pragma at the top of the test file (verify `jsdom` is available; if not, add it to devDeps and `vitest.config`). Provide the minimal DOM the encode path needs.
- [ ] **Step 4:** Run again — expect PASS.
- [ ] **Step 5:** **Revert the fix temporarily** (break `encodeAnsBytes` to drop SAUCE/size) and confirm the test FAILS, then restore. (Cardinal rule: a regression test must fail on broken code.)
- [ ] **Step 6:** Confirm the test is in the `test:ci` glob (`lib/__tests__/**`). Commit: `git commit -am "test: ANSI editor .ans byte round-trip + 80x8 guard"`.

Verification: test passes on good code, fails on broken; included in CI glob.

---

## Task 7: `AnsiEditor.tsx` React wrapper

**Files:**
- Create: `components/ui/AnsiEditor/AnsiEditor.tsx`

- [ ] **Step 1:** Write the component:

```tsx
"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { initAnsiEditor, type EditorHandle } from "./mount";

export interface AnsiEditorRef { getAnsiBytes: () => Promise<Uint8Array>; }

const AnsiEditor = forwardRef<AnsiEditorRef, { onReady?: () => void }>(function AnsiEditor({ onReady }, ref) {
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<EditorHandle | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!hostRef.current) return;
    try {
      handleRef.current = initAnsiEditor(hostRef.current, { onReady });
    } catch { setFailed(true); }
    return () => { handleRef.current?.destroy(); handleRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    getAnsiBytes: async () => {
      if (!handleRef.current) throw new Error("editor not ready");
      return handleRef.current.getAnsiBytes();
    },
  }), []);

  if (failed) return <div className="red">Editor failed to load — use the .ans upload below.</div>;
  return <div ref={hostRef} />;
});
export default AnsiEditor;
```

- [ ] **Step 2:** `npx tsc --noEmit` passes.
- [ ] **Step 3:** Commit: `git commit -am "AnsiEditor: React wrapper with getAnsiBytes ref + load-failure fallback"`.

Verification: `tsc` clean; component exports `AnsiEditorRef`.

---

## Task 8: Wire into Submit Logo tab (replace textarea, keep upload)

**Files:**
- Modify: `app/submit/SubmitClient.tsx`

- [ ] **Step 1:** Remove the ASCII-textarea editor block (the `<Field label="ASCII Art">` canvas added earlier in the sitelogo tab) and the now-unused `logoAscii`/`logoDims`/`logoDimError` state + the `measureAsciiText/checkLogoDims/MAX_LOGO_*` import **if** nothing else in the file uses them (the public ASCII JSON path is going away in favor of editor bytes; the admin ASCII textarea is unaffected, it's a different file).
- [ ] **Step 2:** Add `import AnsiEditor, { type AnsiEditorRef } from "@/components/ui/AnsiEditor/AnsiEditor";` and `const editorRef = useRef<AnsiEditorRef>(null);`.
- [ ] **Step 3:** Render `<AnsiEditor ref={editorRef} />` inside the first sitelogo `<form>` (keep the second `.ans` upload form unchanged).
- [ ] **Step 4:** Replace `handleLogoSubmit` body: `const bytes = await editorRef.current?.getAnsiBytes();` guard empty/undefined → `setStatus({msg, ok:false})`; else POST as multipart exactly like `handleAnsiLogoSubmit` does (`fd.append("ans", new File([bytes], "logo.ans"))`, `fd.append("author", logoAuthor)`, `fd.append("font", "topaz+")`) to `/api/logos`. Reuse the existing 201/else status handling.
- [ ] **Step 5:** `npx tsc --noEmit`; `npm run build` — both pass.
- [ ] **Step 6:** Commit: `git commit -am "submit: replace ASCII textarea with embedded AnsiEditor (keeps .ans upload)"`.

Verification: build passes; submit tab shows the editor + the upload; submitting drawn art creates a `kind='ansi'` row (manual check after deploy / e2e in Phase 2).

**End of Phase 1 — STOP and verify in the browser before Phase 2.** At this point the engine renders an 80×8 Topaz+ canvas with keyboard input, exports `.ans`, and submits through the existing pipeline. No toolbar yet.

---

## Phase 2 (roadmap — expand into bite-sized tasks after Phase 1)

**Deliverable:** the full tool UI, embeddable and scoped.
- Port text0wnz's toolbar/menu/modal markup (the 73 DOM ids) into DOM generated by `mount.ts` inside the container (not a static `index.html`).
- Bring in `ui.js`, `toolbar.js`, `keyboard.js`, `freehandTools.js` and the tool modules (half-block brush, shapes, mirror, sampler, fill, selection/clipboard, palette picker, F-key blocks).
- **Scope all `document`/`window` listeners** to the container and active-focus only (research found global keydown/drag-drop at `main.js:423-426`, `keyboard.js:177/432/1150`, `ui.js:349/661-684/965`).
- Implement `EditorHandle.destroy()` to remove every listener and clear DOM; add the lifecycle test (mount→unmount leaves zero listeners).
- Wire `loadAnsiBytes()` to the engine `loadAnsi` so re-editing is possible.
**Acceptance:** all tools usable inside the form; host-page keyboard/drag-drop unaffected while editor unfocused; mount/unmount leaks nothing.

## Phase 3 (roadmap)

**Deliverable:** de-full-screen CSS + strip remaining collab/PWA.
- Replace text0wnz's `position: fixed` full-screen layout with container-relative layout; vendor + scope its CSS (Tailwind/custom) to the editor root only.
- Remove `network.js`, `websocket.js`, chat UI, service-worker registration entirely from the vendored set; hide the resize UI (canvas stays locked 80×8).
**Acceptance:** editor occupies only its panel; no service worker registered; no network module shipped.

## Phase 4 (roadmap)

**Deliverable:** validation polish + e2e.
- Empty-canvas submit guard (no non-space cells → blocked with message).
- Playwright e2e: draw cells → submit → assert `kind='ansi'` row + header/admin renders it.
- Confirm server still re-validates 80×8 via `processAnsiUpload` for editor-originated bytes.
**Acceptance:** e2e green; oversized/empty rejected; deploys clean.

---

## Out of scope (separate spec/plan)

Real-time collaboration: text0wnz's Bun websocket server (port/host + auth-tied rooms), shareable sessions, the `/logoeditor` route, chat. Phase 1–4 keep the editor solo.

---

## Self-review

- **Spec coverage:** deep-fork React component (Tasks 2,5,7) ✓; full toolset (Phase 2) ✓; Topaz+ + SAUCE (Tasks 4,5,8) ✓; 80×8 lock (Task 5) + server re-validate (Task 8, Phase 4) ✓; remove textarea, keep upload (Task 8) ✓; existing pipeline, no new API (Task 8) ✓; error fallback (Task 7) + empty guard (Phase 4) ✓; round-trip + lifecycle + e2e tests (Tasks 6, Phases 2/4) ✓; collab out of scope ✓.
- **Type consistency:** `EditorHandle.getAnsiBytes` (mount.ts) → `AnsiEditorRef.getAnsiBytes` (AnsiEditor.tsx) → `editorRef.current.getAnsiBytes()` (SubmitClient) — consistent `Promise<Uint8Array>`. `encodeAnsBytes({iceColors,...})` signature consistent across file.js/mount.ts.
- **Placeholders:** Phase 1 steps carry real code/commands. Phases 2–4 are explicitly labeled roadmap (deliverable + acceptance), not fake-detailed steps — per the honesty note, expanded after Phase 1.
