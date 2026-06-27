import { describe, expect, it } from "vitest";
import { buildAdminCollyEditHref } from "@/app/admin/collys/editHref";
import { buildLegacyAdminHashRedirect } from "@/app/admin/legacyHash";

describe("buildAdminCollyEditHref", () => {
  it("routes admin colly edit links to the migrated editable collys admin page", () => {
    expect(buildAdminCollyEditHref("chr-checkmate.ans")).toBe("/admin/collys?q=chr-checkmate.ans");
  });

  it("URL-encodes filenames before putting them in the admin search query", () => {
    expect(buildAdminCollyEditHref("foo bar.ans")).toBe("/admin/collys?q=foo%20bar.ans");
  });
});

describe("buildLegacyAdminHashRedirect", () => {
  it("redirects legacy colly tab hashes to the migrated editable collys admin page", () => {
    expect(buildLegacyAdminHashRedirect("#colly?getcollyname=chr-checkmate.ans")).toBe("/admin/collys?q=chr-checkmate.ans");
  });
});
