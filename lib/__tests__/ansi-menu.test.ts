import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { cssRule } from "./cssRule";

/**
 * Pages here had grown rows of a dozen buttons because a button was the only
 * control the theme offered. AnsiMenu is the other one, drawn the way the rest
 * of the site is drawn: a labelled trigger and a list of items on the 8x16
 * grid, in the site's panel colours, with ASCII for state.
 *
 * The release page is the first user; the forum's per-post actions and the
 * message list's per-row actions are the next candidates.
 */

const menu = readFileSync(path.join(process.cwd(), "components/ui/AnsiMenu.tsx"), "utf8");
const css = readFileSync(path.join(process.cwd(), "assets/css/site.css"), "utf8");

describe("AnsiMenu", () => {
  it("draws its rows on the 8x16 grid", () => {
    expect(menu).toMatch(/height: "16px",\s*\n\s*lineHeight: "16px",\s*\n\s*padding: "0 8px"/);
    expect(menu).toMatch(/padding: "8px 0"/);
  });

  it("uses the site's font and panel colours, not a component library's", () => {
    expect(menu).toMatch(/fontFamily: "TopazPlus_a1200/);
    expect(menu).toMatch(/background: "#222222"/);
    expect(menu).toMatch(/outline: "1px solid #555555"/);
    // No rounded corners anywhere on this site.
    expect(menu).not.toMatch(/borderRadius/);
  });

  it("marks state in ASCII rather than with icons", () => {
    expect(menu).toMatch(/item\.checked \? "\[X\] " : "\[ \] "/);
    expect(menu).toMatch(/item\.current \? ">   " : "    "/);
  });

  it("swaps the colours on the row under the pointer", () => {
    // Hover cannot be expressed inline, and the whole point is that it reads
    // like the rest of the site.
    const rule = cssRule(css, ".ansi-menu-item:hover,");
    expect(rule).toMatch(/background: #cccccc !important/);
    expect(rule).toMatch(/color: #111111 !important/);
  });

  it("keeps the menu open for a toggle and closes it for an action", () => {
    // You usually flip two or three settings in a row.
    expect(menu).toMatch(/const close = \(\) => \{ if \(!item\.keepOpen\) setOpen\(false\); \};/);
  });

  it("closes on an outside pointerdown and on Escape, and gives focus back", () => {
    expect(menu).toMatch(/document\.addEventListener\("mousedown", onDown\)/);
    expect(menu).toMatch(/if \(e\.key !== "Escape"\) return;/);
    expect(menu).toMatch(/triggerRef\.current\?\.focus\(\)/);
  });

  it("renders a link as a real anchor", () => {
    // So middle-click and "open in new tab" work on the share targets.
    expect(menu).toMatch(/if \(item\.href\) \{[\s\S]*?<a/);
    expect(menu).toMatch(/target=\{item\.external \? "_blank" : undefined\}/);
    expect(menu).toMatch(/rel=\{item\.external \? "noreferrer" : undefined\}/);
  });

  it("announces itself to a screen reader as a menu", () => {
    expect(menu).toMatch(/aria-haspopup="menu"/);
    expect(menu).toMatch(/aria-expanded=\{open\}/);
    expect(menu).toMatch(/role="menuitem"/);
  });
});

describe("the forum's per-post actions", () => {
  const actions = readFileSync(
    path.join(process.cwd(), "components/forum/PostActions.tsx"),
    "utf8",
  );

  it("is one menu rather than three buttons under every post", () => {
    // Three is not many on its own, but they repeat: a twenty-post thread
    // carried sixty buttons, all shouting as loudly as the posts.
    expect(actions).toMatch(/<AnsiMenu\s*\n\s*label="Actions"/);
    expect(actions).not.toMatch(/>\s*EDIT\s*</);
    expect(actions).not.toMatch(/>\s*DELETE\s*</);
    expect(actions).not.toMatch(/>\s*REPORT\s*</);
  });

  it("still gates each entry on its own permission", () => {
    expect(actions).toMatch(/canEdit \? \[\{ label: "Edit"/);
    expect(actions).toMatch(/canDelete \? \[\{ label: "Delete"/);
    expect(actions).toMatch(/canReport \? \[\{ label: "Report"/);
    // And renders nothing at all when the reader may do none of them.
    expect(actions).toMatch(/if \(!canEdit && !canDelete && !canReport\) return null;/);
  });

  it("hangs the menu from the trigger's right edge", () => {
    // The actions sit at the right of the post card; a left-hung menu would
    // run off the side of it.
    expect(actions).toMatch(/align="right"/);
  });
});
