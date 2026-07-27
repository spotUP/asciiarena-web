import { describe, it, expect, beforeEach } from "vitest";
import path from "path";
import { collyFilePath } from "@/lib/collyText";

describe("collyFilePath", () => {
  const testCollectionsPath = path.join(__dirname, "..", "..", "__tests__", "fixtures", "collections");

  beforeEach(() => {
    process.env.COLLECTIONS_PATH = testCollectionsPath;
  });

  it("resolves a normal filename inside the collections directory", () => {
    const result = collyFilePath("test.ans");
    const expected = path.join(testCollectionsPath, "test", "test.ans");
    expect(result).toBe(expected);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.startsWith(testCollectionsPath + path.sep)).toBe(true);
    }
  });

  it("rejects parent directory traversal with ../../../../etc/passwd", () => {
    const result = collyFilePath("../../../../etc/passwd");
    expect(result).toBeNull();
  });

  it("rejects absolute path /etc/passwd", () => {
    const result = collyFilePath("/etc/passwd");
    expect(result).toBeNull();
  });

  it("rejects URL-decoded traversal", () => {
    const result = collyFilePath("..%2F..%2Fetc%2Fpasswd");
    expect(result).toBeNull();
  });

  it("rejects filenames containing null bytes", () => {
    const result = collyFilePath("test\x00.ans");
    expect(result).toBeNull();
  });

  it("rejects sibling directory prefix traversal /collections-evil", () => {
    const result = collyFilePath("../collections-evil/passwd");
    expect(result).toBeNull();
  });
});
