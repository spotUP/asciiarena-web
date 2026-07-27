import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { WIDGET_KEYS } from "@/lib/widgets-types";

// The three places widgets are mounted. Each entry is gated on
// `!hidden.has("key")` and must also be wrapped in <Hideable widgetKey="key">,
// or that widget quietly loses its [X] — the kind of omission nobody notices
// until a user asks why one box cannot be dismissed.
const MOUNT_POINTS = [
  "components/layout/LeftSidebar.tsx",
  "components/layout/RightSidebar.tsx",
  "app/page.tsx",
];

function read(rel: string): string {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

function keysGatedOn(source: string): string[] {
  return [...source.matchAll(/hidden\.has\("([a-z_]+)"\)/g)].map(m => m[1]);
}

function keysWrappedInHideable(source: string): string[] {
  return [...source.matchAll(/<Hideable\s+widgetKey="([a-z_]+)"/g)].map(m => m[1]);
}

describe("every mounted widget can be hidden from its own corner", () => {
  for (const file of MOUNT_POINTS) {
    it(`${file} wraps every gated widget in <Hideable>`, () => {
      const source = read(file);
      const gated = keysGatedOn(source);
      const wrapped = new Set(keysWrappedInHideable(source));
      expect(gated.length).toBeGreaterThan(0);
      for (const key of gated) {
        expect(wrapped.has(key), `${key} is gated on hidden.has() but has no [X]`).toBe(true);
      }
    });

    it(`${file} only uses keys that exist in the registry`, () => {
      // A typo'd key would be a widget the settings page can never restore.
      const source = read(file);
      for (const key of [...keysGatedOn(source), ...keysWrappedInHideable(source)]) {
        expect(WIDGET_KEYS as readonly string[]).toContain(key);
      }
    });
  }
});

describe("the [X] cannot strand itself on an empty widget", () => {
  it("keeps the button hidden unless its frame has real content", () => {
    // Hideable renders the button before the widget, so a widget that returns
    // null would leave a floating [X]. The :has() rule is what prevents it —
    // if this selector goes, the bug comes back silently.
    const css = read("assets/css/site.css");
    expect(css).toContain(".widget-hide-btn");
    expect(css).toMatch(/\.widget-frame:has\(>\s*\*:not\(\.widget-hide-btn\)\)\s*\.widget-hide-btn/);
    expect(css).toMatch(/\.widget-hide-btn\s*\{[^}]*display:\s*none/);
  });
});
