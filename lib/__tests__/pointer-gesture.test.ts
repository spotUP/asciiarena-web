import { describe, expect, it } from "vitest";

import { createPointerGesture } from "@/lib/pointer-gesture";

/**
 * The bug: in the ANSI editor, clicking the canvas to drop a selection marked
 * one character instead of clearing it. The selection tool opens a 1x1
 * selection on pointer-down so a drag has something to extend, and nothing
 * ever undid that for a click that never dragged.
 */
describe("pointer gesture", () => {
  it("treats a press and release on one cell as a click", () => {
    const g = createPointerGesture();

    g.down(10, 4);

    expect(g.isClick()).toBe(true);
  });

  it("still a click when the pointer jitters inside the same cell", () => {
    // Pointer moves fire per pixel, not per cell. A hand that shakes while
    // clicking must not be read as a drag, or deselecting becomes unreliable.
    const g = createPointerGesture();

    g.down(10, 4);
    g.move(10, 4);
    g.move(10, 4);

    expect(g.isClick()).toBe(true);
  });

  it("is a drag once the pointer leaves the cell horizontally", () => {
    const g = createPointerGesture();

    g.down(10, 4);
    g.move(11, 4);

    expect(g.isClick()).toBe(false);
  });

  it("is a drag once the pointer leaves the cell vertically", () => {
    const g = createPointerGesture();

    g.down(10, 4);
    g.move(10, 5);

    expect(g.isClick()).toBe(false);
  });

  it("stays a drag after returning to the starting cell", () => {
    // Dragging out and back is a selection the user drew, not a click. If this
    // reported a click, that selection would be cleared on release.
    const g = createPointerGesture();

    g.down(10, 4);
    g.move(14, 9);
    g.move(10, 4);

    expect(g.isClick()).toBe(false);
  });

  it("resets on the next press so one drag does not poison later clicks", () => {
    const g = createPointerGesture();

    g.down(10, 4);
    g.move(14, 9);
    g.down(2, 2);

    expect(g.isClick()).toBe(true);
  });
});
