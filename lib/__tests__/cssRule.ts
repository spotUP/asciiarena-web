/**
 * Pull one CSS rule's declarations out of a stylesheet, for tests that assert
 * on geometry the site depends on.
 *
 * A trailing brace in `selector` is stripped first. Leaving it in made an
 * earlier version of this pattern demand a SECOND brace, so it matched across
 * into the following rule and quietly asserted against the wrong
 * declarations -- a test that passes for the wrong reason is worse than no
 * test.
 */
export function cssRule(css: string, selector: string): string {
  const head = selector.replace(/\s*\{\s*$/, "").trim();
  const escaped = head.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // A selector ending in a comma is the head of a multi-line list, so the rest
  // of the list may follow. Anything else must be the WHOLE list: without that,
  // "input, optgroup" also matched the earlier "input, optgroup, textarea"
  // rule and the assertions landed on the wrong declarations.
  const tail = head.endsWith(",") ? "[^{]*" : "\\s*";
  const re = new RegExp(`^${escaped}${tail}\\{[^}]*\\}`, "m");
  return css.match(re)?.[0] ?? "";
}
