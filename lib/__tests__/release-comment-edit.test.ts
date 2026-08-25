import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Three defects reported against editing a comment on a release page:
 *
 *   - clicking Edit looked like it did nothing. The form renders at the very
 *     bottom of the page, under every comment, and opening it also hides the
 *     art -- so the box the reader is meant to type in was off-screen.
 *   - Save did nothing, silently. See lib/commentOwnership.ts for the cause;
 *     here the point is that a refusal has to reach the reader instead of the
 *     form closing as though it had worked.
 *   - Cancel and Save sat flush against each other, unlike every other button
 *     row on the page.
 */

const source = readFileSync(
  path.join(process.cwd(), "app/release/[filename]/ReleaseClient.tsx"),
  "utf8",
);
const actions = readFileSync(path.join(process.cwd(), "app/actions/collys.ts"), "utf8");

describe("editing a comment", () => {
  it("scrolls the edit form into view and focuses it when it opens", () => {
    expect(source).toMatch(/if \(section !== "edit-comment"\) return;/);
    expect(source).toMatch(/editFormRef\.current\?\.scrollIntoView\(/);
    expect(source).toMatch(/editTextRef\.current\?\.focus\(\)/);
  });

  it("attaches those refs to the form and its textarea", () => {
    expect(source).toMatch(/<div ref=\{editFormRef\}>/);
    expect(source).toMatch(/<textarea ref=\{editTextRef\}/);
  });

  it("tells the reader when a save is refused, and keeps their text", () => {
    expect(source).toMatch(/const r = await editCommentAction\(collyId, editId, editText\);\s*\n\s*if \(!r\.success\) \{/);
    // The early return is what leaves the form open with the text still in it.
    expect(source).toMatch(/toast\(`\[!\] \$\{r\.error \?\? "Could not save your comment\."\}`, "danger"\);\s*\n\s*return;/);
  });

  it("offers Edit on the rows the server will actually let you edit", () => {
    expect(source).toMatch(/\{c\.mine && \(/);
    expect(source).not.toMatch(/c\.nick === userNick/);
  });

  it("spaces Cancel and Save apart", () => {
    expect(source).toMatch(
      /<div className="col-12 apt-1" style=\{\{ display: "flex", gap: "8px" \}\}>\s*\n\s*<input type="button" className="btn-big" value="Cancel"/,
    );
  });

  it("refuses a change server-side instead of reporting a write that never happened", () => {
    expect(actions).toMatch(/async function commentForChange\(/);
    expect(actions).toMatch(/if \(!may\.allowed\) return \{ success: false, error: may\.error \};/);
    // The old shape: an admin/author WHERE fragment spliced into the write,
    // whose row count nothing ever looked at.
    expect(actions).not.toMatch(/Prisma\.sql`WHERE commentid/);
  });
});
