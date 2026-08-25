import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  STALE_DEPLOYMENT_MESSAGE,
  actionErrorMessage,
  isStaleActionError,
} from "@/lib/staleDeployment";

/**
 * Regression: "i can not post it, nothing happens -- and no toast or nothing."
 *
 * The prod journal had the answer:
 *
 *   Error: Failed to find Server Action "70335946fc...". This request might be
 *   from an older or newer deployment.
 *
 * Next names each server action with a build hash, so a page still open across
 * a deploy calls names the running build has dropped. The call rejects, and
 * every handler that awaited one stopped where it stood: no post, no message.
 * Reported for the forum composer and for saving a comment edit, but it was
 * every form on the site.
 */
describe("stale deployment detection", () => {
  it("recognises the error Next throws for an action from another build", () => {
    const err = new Error(
      'Failed to find Server Action "70335946fc271cfcbb8de2647fcdc147889ac68c7d". ' +
        "This request might be from an older or newer deployment.",
    );
    expect(isStaleActionError(err)).toBe(true);
    expect(actionErrorMessage(err, "Could not post.")).toBe(STALE_DEPLOYMENT_MESSAGE);
  });

  it("recognises it however the message reaches us", () => {
    expect(isStaleActionError("This request might be from an older or newer deployment.")).toBe(true);
  });

  it("leaves an ordinary failure to its own message", () => {
    const err = new Error("Connection lost");
    expect(isStaleActionError(err)).toBe(false);
    expect(actionErrorMessage(err, "Could not post.")).toBe("Could not post.");
    // A raw exception string is not an explanation -- the caller's words win.
    expect(actionErrorMessage(err, "Could not post.")).not.toContain("Connection lost");
  });

  it("survives a rejection that is not an Error at all", () => {
    expect(isStaleActionError(undefined)).toBe(false);
    expect(actionErrorMessage(null, "Could not post.")).toBe("Could not post.");
  });

  it("tells the reader their text is still there", () => {
    // They have just typed a post or an edit; the first thing they need to know
    // is that reloading will not eat it.
    expect(STALE_DEPLOYMENT_MESSAGE).toMatch(/Reload/);
    expect(STALE_DEPLOYMENT_MESSAGE).toMatch(/still here/);
  });
});

describe("every submit path reports a rejection", () => {
  const files = [
    "components/forum/NewTopicForm.tsx",
    "components/forum/ReplyComposer.tsx",
    "app/release/[filename]/ReleaseClient.tsx",
  ];

  for (const file of files) {
    it(`${file} routes a thrown action through actionErrorMessage`, () => {
      const source = readFileSync(path.join(process.cwd(), file), "utf8");
      expect(source).toMatch(/import \{ actionErrorMessage \} from "@\/lib\/staleDeployment";/);
      expect(source).toMatch(/catch \(err\) \{[\s\S]*?actionErrorMessage\(err,/);
    });
  }

  it("clears the busy flag in the forum composers however the submit ends", () => {
    // Without the finally, a rejection left busy true and the POST button
    // disabled for good -- a second silent failure on top of the first.
    for (const file of ["components/forum/NewTopicForm.tsx", "components/forum/ReplyComposer.tsx"]) {
      const source = readFileSync(path.join(process.cwd(), file), "utf8");
      expect(source, file).toMatch(/\} finally \{\s*\n\s*setBusy\(false\);\s*\n\s*\}/);
    }
  });
});
