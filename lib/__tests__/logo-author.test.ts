import { describe, expect, it } from "vitest";
import { readLogoAuthor } from "@/lib/logo-author";

describe("readLogoAuthor", () => {
  it("trims the submitted author from multipart form data", () => {
    const form = new FormData();
    form.append("author", "  spot  ");

    expect(readLogoAuthor(form)).toBe("spot");
  });

  it("returns an empty string when the author field is missing", () => {
    expect(readLogoAuthor(new FormData())).toBe("");
  });
});
