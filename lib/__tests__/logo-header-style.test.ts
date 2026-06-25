import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";

describe("logo header styling", () => {
  it("keeps the rotating logo frame on a true black background for ANSI logos", () => {
    const css = readFileSync(path.join(process.cwd(), "assets/css/site.css"), "utf8");
    expect(css).toMatch(/\.logo-header-frame\s*\{[\s\S]*?background-color:\s*#000000;/);
  });
});
