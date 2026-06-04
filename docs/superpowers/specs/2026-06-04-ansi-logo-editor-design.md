---
date: 2026-06-04
topic: ansi-logo-editor
tags: [ansi, logos, editor, text0wnz, submit]
status: draft
---

# In-browser ANSI logo editor (sub-project 1: embedded solo editor)

## Goal

Replace the plain ASCII textarea on the Submit Logo tab with a real in-browser
ANSI art editor (deep-forked from **text0wnz**, MIT), locked to the site's 80x8
header logo limit, producing `.ans` bytes that flow into the existing ANSI logo
pipeline. Real-time collaboration is explicitly **phase 2** and out of scope here.

## Decisions (settled during brainstorming)

- **Editor source:** [text0wnz](https://github.com/xero/moebius-web) (MIT, vanilla
  JS + canvas + bitmap CP437/Topaz fonts). Deep-forked into a **native React
  component**, not embedded via iframe and not a separate route.
- **Toolset:** full client-side toolset (keyboard typing, F-key CP437 blocks,
  half-block brush, fg/bg 16-color palette + iCE, fill, shapes, mirror, sampler,
  selection/clipboard, undo/redo). The **network/collab/chat layer is stripped**
  for phase 1.
- **Font:** Topaz+ 1200 8x16 (matches the asciiarena UI). Written into the SAUCE
  record so the header's AnsiLove renderer matches exactly.
- **Canvas:** locked to **80x8**; resize UI hidden.
- **Submit Logo tab:** remove the ASCII textarea (the 80x8 plain-text canvas built
  earlier); add `<AnsiEditor>`; **keep** the `.ans` file upload as a second path /
  fallback.
- **Storage/render:** editor output is `.ans` bytes → POST to the **existing**
  multipart branch of `/api/logos` → `processAnsiUpload` (re-validates 80x8) →
  `ansi_b64` / `kind='ansi'` → rendered by the existing `AnsiLogo` component in the
  header and admin. **No new API endpoint, no schema change.**
- **Phasing:** ship this solo editor first; design collaboration as its own
  spec/plan afterward.

## Why deep-fork (and the cost)

text0wnz is not built to be embedded. Investigation of the source found:

- `main.js` has **zero exports** and self-initializes on `DOMContentLoaded`
  (`src/js/client/main.js:282`).
- It requires **73+ hard-coded DOM ids** (toolbars, menus, modals, F-key
  canvases) present in its `index.html`.
- Its root container is `position: fixed` full-screen (`#bodyContainer`).
- It attaches **global `document`/`window` listeners** that hijack Ctrl+Z, the
  F1-F12 keys, number keys 0-7, window resize, and all drag-drop.
- Module-level singletons (`stateManager`, toolbar state) prevent two instances
  per page.

The user chose the native-component route over an iframe, so the bulk of phase 1
is **making the engine embeddable**. The engine itself is solid and reused as-is:

- Cell model: `Uint16Array`, `char<<8 | bg<<4 | fg` (`canvas.js:1114`).
- `resize(cols, rows)` exists to set dimensions (`canvas.js:885`).
- 16-color ANSI palette + iCE toggle (`palette.js:304`, `canvas.js:912`).
- Export writes `.ans` + SAUCE entirely client-side (`file.js:1355` `encodeANSi`,
  `file.js:1230` `createSauce`) — but currently only triggers a **download**, not a
  byte return.
- Import/parse: `loadAnsi(bytes)` (`file.js:226`).

## Architecture

New component `components/ui/AnsiEditor/`, three layers with clear boundaries:

1. **`engine/`** — vendored text0wnz client modules (`canvas.js`, `font.js`,
   `file.js`, `palette.js`, `state.js`, drawing tools, `keyboard.js`, trimmed
   `ui.js`/`toolbar.js`), with the upstream MIT `LICENSE` retained. Edited only
   where embedding requires it.
2. **`mount.ts`** — the entry point text0wnz lacks:
   `init(container: HTMLElement, opts) => EditorHandle`. Builds the editor DOM
   **inside `container`** (not `document.body`), wires tools, applies the 80x8 +
   Topaz+ config, and returns
   `{ getAnsiBytes(): Uint8Array; loadAnsiBytes(bytes: Uint8Array): void; destroy(): void }`.
3. **`AnsiEditor.tsx`** — React wrapper. Mounts the engine into a `ref`'d `<div>`
   on mount, calls `destroy()` on unmount, exposes `getAnsiBytes()` via
   `useImperativeHandle`. Presentation/lifecycle only; no drawing logic.

Font PNGs (Topaz+ 1200 8x16) and editor assets are served from `public/`. The
engine CSS (Tailwind + custom) is scoped to the editor container.

### The embedding fork work

1. **De-full-screen** the root layout to fill our container instead of the page.
2. **Generate the editor DOM** from `mount.ts` inside the container, replacing the
   static 73-id `index.html`.
3. **Scope global listeners** to the container and only while it holds focus, so
   the host page keeps its own keyboard/drag-drop.
4. **Expose bytes:** split serialization from the download path so `getAnsiBytes()`
   returns the `Uint8Array` (+ SAUCE).
5. **Lock to 80x8:** boot with `resize(80, 8)`, Topaz+ font, iCE colors on; hide
   the resize UI.
6. **Strip for phase 1:** remove `network.js`, `websocket.js`, chat UI, service
   worker.

## Data flow (submit)

1. User draws in `<AnsiEditor>` on the Submit Logo tab.
2. On submit, the page calls `editorRef.current.getAnsiBytes()`.
3. Bytes are wrapped in a `Blob`/`File` and POSTed to the existing multipart ANSI
   branch of `/api/logos` (same request shape as the `.ans` upload), with the font
   (Topaz+) passed through.
4. Server `processAnsiUpload` re-validates 80x8 (`measureAnsi` + `checkLogoDims`),
   base64-encodes, and inserts `(kind='ansi', ansi_b64, font, author)`.
5. Header and admin render it via the existing `AnsiLogo` component; SAUCE/font
   ensure AnsiLove matches the editor's Topaz+ rendering.

## Error handling

- **Size:** canvas physically locked to 80x8; server re-validates as defense in
  depth.
- **Empty canvas:** submit blocked with a message if no non-space cells exist.
- **Engine mount failure** (font/asset load): component renders a fallback
  ("editor failed to load — use the .ans upload below"); the upload path is always
  a working escape hatch.
- **Export integrity:** `getAnsiBytes()` is the single byte source; if it throws or
  returns empty, submit aborts rather than POSTing garbage.

## Testing

- **Pure round-trip (unit, `test:ci`):** known cell buffer → `getAnsiBytes()` →
  `measureAnsi` asserts 80x8 → `loadAnsi` re-parse yields the identical buffer.
  This is the critical interop guard.
- **Component lifecycle:** mount/unmount attaches no surviving global listeners and
  leaks no DOM.
- **E2E (Playwright):** draw cells → submit → assert a `kind='ansi'` row is created
  and renders in the header/admin.

## Implementation phasing (de-risks the fork)

1. **Engine-in-a-div:** vendored engine renders a bare 80x8 Topaz+ canvas inside a
   React `<div>`, no toolbar — prove mount/destroy + `getAnsiBytes()` + round-trip
   test. Smallest slice that proves the hard part.
2. **Tooling UI:** toolbar/palette/tools; scope listeners; de-full-screen CSS.
3. **Strip & polish:** remove collab/SW/network; lock resize UI; scope styles.
4. **Wire to submit:** replace textarea, keep upload, POST bytes through the
   existing pipeline; e2e test.

## Out of scope (phase 2)

Real-time collaboration, the websocket server (text0wnz's Bun server, to be
ported/hosted with auth-tied rooms), shareable sessions, a standalone
`/logoeditor` route, and chat. Phase 1 strips the network layer so the editor
stays solo.

## Critical files

- New: `components/ui/AnsiEditor/{AnsiEditor.tsx,mount.ts,engine/*}` + vendored
  `LICENSE`, Topaz+ font asset in `public/`.
- Modify: `app/submit/SubmitClient.tsx` (swap textarea for `<AnsiEditor>`, keep
  upload, submit via `getAnsiBytes()`).
- Reuse unchanged: `app/api/logos/route.ts` (multipart ANSI branch),
  `lib/logoUpload.ts` (`processAnsiUpload`), `lib/ansiDims.ts`
  (`measureAnsi`/`checkLogoDims`), `components/ui/AnsiLogo.tsx`.
