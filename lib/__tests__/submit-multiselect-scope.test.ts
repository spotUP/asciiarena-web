import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Regression: "when i upload a new colly (ansi) and enter artists and crews,
 * it's not saved. i have to edit and add them again."
 *
 * MultiSelect -- the row of comboboxes behind Artist(s), Crew(s) and BBS(es) --
 * was declared inside SubmitClient's body. A component defined in another
 * component's body is a NEW function on every render, so React cannot match it
 * to the previous element type: it unmounts the whole subtree and mounts a
 * fresh one. Any state change in SubmitClient did it, including the status
 * message dismissing itself on a four-second timer.
 *
 * The remount replaced the focused <input> with a new DOM node, dropping both
 * the focus and the text typed into it, which the combobox had not committed to
 * the parent yet (it commits on blur -- see lib/combobox-commit.ts). The colly
 * then posted empty artistname[] / crewname[] arrays.
 *
 * The fix is structural, so the test is: no component is declared inside
 * another component in this file.
 */

const SOURCE = readFileSync(path.join(process.cwd(), "app/submit/SubmitClient.tsx"), "utf8");

describe("SubmitClient component scope", () => {
  it("declares MultiSelect at module scope, not inside SubmitClient", () => {
    const multiSelect = SOURCE.indexOf("function MultiSelect(");
    const submitClient = SOURCE.indexOf("export default function SubmitClient(");
    expect(multiSelect).toBeGreaterThan(-1);
    expect(submitClient).toBeGreaterThan(-1);
    expect(
      multiSelect,
      "MultiSelect is declared after SubmitClient opens, i.e. nested inside it",
    ).toBeLessThan(submitClient);
  });

  it("declares no component inside another component", () => {
    // Any `function Name(` indented at all: nested in something. A component is
    // the capitalised case -- helpers and handlers may live inside a component.
    const nested = SOURCE.split("\n").filter(line => /^\s+(async\s+)?function\s+[A-Z]/.test(line));
    expect(nested, `nested component declarations: ${nested.join(" | ")}`).toEqual([]);
  });
});
