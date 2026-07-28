/**
 * Telling a click apart from a drag, in canvas cell coordinates.
 *
 * The ANSI editor's selection tool opens a 1x1 selection on pointer-down so a
 * drag has something to extend. That left no way to deselect with the mouse:
 * clicking on the canvas to drop a selection marked a single cell instead of
 * clearing it. The tool needs to know, at pointer-up, whether the pointer ever
 * left the cell it went down on.
 *
 * Kept here rather than inline in the engine so the rule is testable without
 * standing up the whole editor, and so "did it drag" has one definition.
 */
export interface PointerGesture {
  /** Pointer went down on a cell. Starts a new gesture. */
  down(x: number, y: number): void;
  /** Pointer moved. Fires per pointer move, including within the same cell. */
  move(x: number, y: number): void;
  /** True when the pointer never left the cell it went down on. */
  isClick(): boolean;
}

export function createPointerGesture(): PointerGesture {
  let downX = 0;
  let downY = 0;
  let dragged = false;

  return {
    down(x, y) {
      downX = x;
      downY = y;
      dragged = false;
    },
    move(x, y) {
      // Compare cells, not event counts: a pointer can emit many move events
      // while staying inside one character cell, and those are still a click.
      if (x !== downX || y !== downY) dragged = true;
    },
    isClick() {
      return !dragged;
    },
  };
}
