/**
 * How many rows of a parsed ANSI canvas actually hold something.
 *
 * The forum composer is a fixed 25-row canvas (components/forum/PostCanvas),
 * so a one-line reply is stored as one line plus 24 blank rows -- real content,
 * not layout, which is why it cannot be fixed with CSS. Rendering the full
 * canvas puts a tall empty block under every short post.
 *
 * Trailing blank rows are dropped at render time rather than at post time: the
 * stored file stays exactly what was drawn (it is still a valid .ans anyone can
 * download), and posts that are already in the database benefit too.
 *
 * Blank means nothing was drawn: a space or a NUL on a black background. A
 * coloured background IS a drawing -- filled blocks are how half the art on the
 * site is made -- so a row of coloured spaces counts as content.
 */

/** The engine's flat [char, foreground, background] triplets, row-major. */
export type AnsiCells = ArrayLike<number>;

/**
 * Is one cell blank -- nothing drawn there?
 *
 * The single definition of "blank" for the whole editor: the render side reads
 * [char, fg, bg] triplets and the composer reads the engine's packed 16-bit
 * cells, and the two had drifted. A post drawn only in background colour was
 * rejected with "Draw something before you post" because the composer looked at
 * the character alone and saw a canvas full of spaces.
 *
 * A NUL or a space on the default (black) background is blank. Any background
 * colour is a drawing -- filled blocks are how half the art on the site is
 * made. A foreground colour on a space is NOT: nothing of it is visible.
 */
export function isBlankCell(charCode: number, background: number): boolean {
  if (background !== 0) return false;
  return charCode === 0 || charCode === 32;
}

/**
 * The same question for the engine's packed cell format, which is what
 * canvas.getImageData() hands out: (charCode << 8) + (background << 4) + fg.
 */
export function isBlankPackedCell(cell: number): boolean {
  return isBlankCell(cell >> 8, (cell >> 4) & 15);
}

function rowIsBlank(data: AnsiCells, columns: number, row: number): boolean {
  for (let col = 0; col < columns; col++) {
    const at = (row * columns + col) * 3;
    if (!isBlankCell(data[at] ?? 0, data[at + 2] ?? 0)) return false;
  }
  return true;
}

/**
 * Rows to render: everything up to and including the last non-blank one.
 *
 * Never returns 0. A canvas that is blank all the way down still renders one
 * row, so an empty attachment is a thin strip rather than a zero-height image
 * the browser reports as broken.
 */
export function visibleRows(data: AnsiCells, columns: number, rows: number): number {
  if (columns <= 0 || rows <= 0) return 0;
  for (let row = rows - 1; row >= 0; row--) {
    if (!rowIsBlank(data, columns, row)) return row + 1;
  }
  return 1;
}
