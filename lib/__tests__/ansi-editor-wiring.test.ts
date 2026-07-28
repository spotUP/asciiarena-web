import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { EDITOR_MARKUP } from "@/components/ui/AnsiEditor/markup";

/**
 * Regression: the forum composer came up with no active tool. Nothing could be
 * typed into the canvas and no tool button responded.
 *
 * Cause: mount.ts removed the File menu's save/export nodes for the forum.
 * bootstrapEditor RETURNS synchronously but keeps booting asynchronously, so
 * the nodes were gone before boot reached `onClick($('saveAnsi'), Save.ans)`.
 * The engine's onClick dereferences its element immediately, so that threw
 * "Cannot read properties of null (reading 'addEventListener')" and killed the
 * rest of boot -- including Toolbar.add($('keyboard')), which is what makes the
 * text tool work.
 *
 * The engine resolves its entire UI by getElementById against the injected
 * markup. So the invariant is simply: every id the engine looks up has to exist
 * in that markup. This test would have failed the moment those nodes were
 * dropped, instead of the editor silently coming up dead.
 */

const bootstrap = readFileSync(
  path.join(process.cwd(), "components/ui/AnsiEditor/engine/bootstrap.js"),
  "utf8",
);

/**
 * Ids the engine creates at runtime rather than reading from the markup, so
 * their absence is expected. Keep this list short and justified -- an entry
 * here is a hole in the check.
 */
const RUNTIME_IDS = new Set<string>([]);

function idsLookedUpBy(source: string): string[] {
  const found = new Set<string>();
  // $('someId') — the engine's alias for document.getElementById.
  for (const m of source.matchAll(/\$\(\s*'([A-Za-z][\w-]*)'\s*\)/g)) found.add(m[1]);
  for (const m of source.matchAll(/\$\(\s*"([A-Za-z][\w-]*)"\s*\)/g)) found.add(m[1]);
  return [...found].filter(id => !RUNTIME_IDS.has(id));
}

function markupHasId(id: string): boolean {
  return (
    EDITOR_MARKUP.includes(`id="${id}"`) || EDITOR_MARKUP.includes(`id='${id}'`)
  );
}

describe("ANSI editor wiring", () => {
  it("finds every id the engine bootstrap looks up", () => {
    const ids = idsLookedUpBy(bootstrap);
    // Sanity: the scan must actually be finding things, or this passes vacuously.
    expect(ids.length).toBeGreaterThan(40);

    const missing = ids.filter(id => !markupHasId(id));

    expect(missing).toEqual([]);
  });

  it("hides engine-wired menu items instead of removing them", () => {
    // This is the check that would actually have caught the outage. The markup
    // still had every id; mount.ts deleted the nodes at runtime, after
    // bootstrapEditor returned but while it was still booting.
    //
    // Source-text assertion on purpose: the failure needs a live DOM plus a
    // booted engine to reproduce, and this repo already guards deploy.sh the
    // same way. If this ever needs to become a real DOM test, good -- but it
    // must not silently disappear.
    const mount = readFileSync(
      path.join(process.cwd(), "components/ui/AnsiEditor/mount.ts"),
      "utf8",
    );
    const branch = mount.slice(mount.indexOf("if (!fileExport)"));
    const body = branch.slice(0, branch.indexOf("\n  }") + 4);

    expect(body).toMatch(/display\s*=\s*"none"/);
    // .remove() here disappears the node before the async boot wires it, and
    // onClick() dereferences its element, so boot dies mid-way and the editor
    // comes up with no active tool.
    expect(body).not.toMatch(/\.remove\(\)/);
  });

  it("keeps the ids that boot dies without", () => {
    // onClick() dereferences its element, so a missing id here is not a dead
    // menu entry -- it aborts the rest of boot. #keyboard is the text tool,
    // registered after the File menu wiring, which is why losing a save item
    // took typing with it.
    for (const id of ["keyboard", "saveAnsi", "savePng", "new", "canvasContainer", "viewport"]) {
      expect(markupHasId(id), `markup is missing #${id}`).toBe(true);
    }
  });
});
