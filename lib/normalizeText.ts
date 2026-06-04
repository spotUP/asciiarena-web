/**
 * Collapse Unicode space variants to a normal ASCII space and strip zero-width /
 * control chars so retro-font UIs don't render .notdef boxes. Keeps \t \n \r.
 *
 * Spaces collapsed (examples): U+00A0 NBSP, U+202F NARROW NO-BREAK SPACE,
 * U+2000–U+200A EN/EM/THIN/HAIR/etc. spaces, U+3000 IDEOGRAPHIC SPACE.
 *
 * Chars stripped: U+200B ZERO-WIDTH SPACE, U+200C ZWNJ, U+200D ZWJ,
 * U+2060 WORD JOINER, U+FEFF BOM/ZERO-WIDTH NO-BREAK SPACE.
 */
export function normalizeMessageText(s: string): string {
  return s
    // Unicode space variants → ASCII space (excludes \t \n \r which are < U+0020)
    .replace(/[   -   　]/g, " ")
    // Zero-width and invisible formatting chars
    .replace(/[​-‍⁠﻿]/g, "");
}
