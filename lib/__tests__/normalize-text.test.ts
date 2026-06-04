import { describe, it, expect } from "vitest";
import { normalizeMessageText } from "../normalizeText";

describe("normalizeMessageText", () => {
  // Unicode space variants → ASCII space
  it("converts non-breaking space U+00A0 to a normal space", () => {
    expect(normalizeMessageText("hello world")).toBe("hello world");
  });

  it("converts narrow no-break space U+202F to a normal space", () => {
    expect(normalizeMessageText("hello world")).toBe("hello world");
  });

  it("converts en space U+2002 to a normal space", () => {
    expect(normalizeMessageText("hello world")).toBe("hello world");
  });

  it("converts em space U+2003 to a normal space", () => {
    expect(normalizeMessageText("hello world")).toBe("hello world");
  });

  it("converts thin space U+2009 to a normal space", () => {
    expect(normalizeMessageText("hello world")).toBe("hello world");
  });

  it("converts hair space U+200A to a normal space", () => {
    expect(normalizeMessageText("hello world")).toBe("hello world");
  });

  it("converts ideographic space U+3000 to a normal space", () => {
    expect(normalizeMessageText("hello　world")).toBe("hello world");
  });

  it("converts OGHAM space mark U+1680 to a normal space", () => {
    expect(normalizeMessageText("hello world")).toBe("hello world");
  });

  it("converts medium math space U+205F to a normal space", () => {
    expect(normalizeMessageText("hello world")).toBe("hello world");
  });

  // Reproduces the reported symptom: autocorrect-injected spaces in a sentence
  it("normalizes a sentence with mixed Unicode spaces (reported symptom)", () => {
    // "replay mail funkar typ inte" with nbsp variants between words
    const input = "replay mail funkar typ inte";
    expect(normalizeMessageText(input)).toBe("replay mail funkar typ inte");
  });

  // Zero-width chars → removed
  it("strips zero-width space U+200B", () => {
    expect(normalizeMessageText("hel​lo")).toBe("hello");
  });

  it("strips zero-width non-joiner U+200C", () => {
    expect(normalizeMessageText("hel‌lo")).toBe("hello");
  });

  it("strips zero-width joiner U+200D", () => {
    expect(normalizeMessageText("hel‍lo")).toBe("hello");
  });

  it("strips word joiner U+2060", () => {
    expect(normalizeMessageText("hel⁠lo")).toBe("hello");
  });

  it("strips BOM / zero-width no-break space U+FEFF", () => {
    expect(normalizeMessageText("﻿hello")).toBe("hello");
  });

  // Normal text must be unchanged
  it("does not alter ASCII text with normal spaces", () => {
    const normal = "Hello, World! How are you?";
    expect(normalizeMessageText(normal)).toBe(normal);
  });

  it("does not alter tabs, newlines, or carriage returns", () => {
    const ws = "line1\tindented\nline2\r\nline3";
    expect(normalizeMessageText(ws)).toBe(ws);
  });

  it("does not alter normal punctuation and symbols", () => {
    const punct = "!@#$%^&*()-_=+[]{}|;:',.<>?/`~\"\\";
    expect(normalizeMessageText(punct)).toBe(punct);
  });

  it("does not alter letters, digits, or accented characters", () => {
    const text = "Ångström café naïve résumé 42 €";
    expect(normalizeMessageText(text)).toBe(text);
  });

  it("handles empty string", () => {
    expect(normalizeMessageText("")).toBe("");
  });

  it("handles string of only normal spaces unchanged", () => {
    expect(normalizeMessageText("   ")).toBe("   ");
  });
});
