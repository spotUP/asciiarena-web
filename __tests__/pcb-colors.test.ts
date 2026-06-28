import { describe, expect, it } from "vitest";
import { convertPcbColors, hasPcbCodes } from "@/lib/pcbColors";

describe("hasPcbCodes", () => {
  it("detects single PCB code", () => {
    expect(hasPcbCodes("@X03hello")).toBe(true);
  });

  it("detects lowercase codes", () => {
    expect(hasPcbCodes("@X0aworld")).toBe(true);
  });

  it("returns false when no codes present", () => {
    expect(hasPcbCodes("hello world")).toBe(false);
    expect(hasPcbCodes("@X")).toBe(false);
    expect(hasPcbCodes("@X0")).toBe(false);
    expect(hasPcbCodes("@X0G")).toBe(false); // G not hex
  });

  it("handles empty string", () => {
    expect(hasPcbCodes("")).toBe(false);
  });

  it("detects codes in HTML-escaped text", () => {
    expect(hasPcbCodes("&lt;div&gt;@X03hello&lt;/div&gt;")).toBe(true);
  });
});

describe("convertPcbColors", () => {
  it("leaves text without codes unchanged", () => {
    expect(convertPcbColors("hello world")).toBe("hello world");
  });

  it("converts single @X code to span", () => {
    const result = convertPcbColors("@X03hello");
    expect(result).toBe(
      '<span style="color:#00AAAA;background-color:#000000;line-height:1">hello</span>',
    );
  });

  it("closes previous span on new colour code", () => {
    const result = convertPcbColors("@X03hello@X05world");
    expect(result).toBe(
      '<span style="color:#00AAAA;background-color:#000000;line-height:1">hello</span>' +
      '<span style="color:#AA00AA;background-color:#000000;line-height:1">world</span>',
    );
  });

  it("uses background colour from first hex digit", () => {
    const result = convertPcbColors("@X3Btest");
    expect(result).toBe(
      '<span style="color:#55FFFF;background-color:#00AAAA;line-height:1">test</span>',
    );
  });

  it("handles lowercase hex digits", () => {
    const result = convertPcbColors("@X0dtest");
    expect(result).toBe(
      '<span style="color:#FF55FF;background-color:#000000;line-height:1">test</span>',
    );
  });

  it("handles full DSK-FAQ snippet", () => {
    const input =
      "@X03@X3B\xb2@X03\xdb\xdb @X03 @X3B\xb2@X03\xdc\xdc\xdc @X05 \xdc\xdb\xdf\xdf\xdf\xdb\xdc";
    const result = convertPcbColors(input);
    // Should contain proper spans, not raw @X codes
    expect(result).not.toContain("@X03");
    expect(result).not.toContain("@X05");
    expect(result).not.toContain("@X3B");
    expect(result).toContain("<span");
    expect(result).toContain("</span>");
    // Should start with a span
    expect(result.startsWith("<span")).toBe(true);
    // Should end with </span>
    expect(result.endsWith("</span>")).toBe(true);
  });

  it("handles text before first code", () => {
    const result = convertPcbColors("before @X03after");
    expect(result).toBe(
      'before <span style="color:#00AAAA;background-color:#000000;line-height:1">after</span>',
    );
  });

  it("handles text after last code", () => {
    const result = convertPcbColors("@X03hello world");
    expect(result).toBe(
      '<span style="color:#00AAAA;background-color:#000000;line-height:1">hello world</span>',
    );
  });

  it("handles empty string", () => {
    expect(convertPcbColors("")).toBe("");
  });

  it("handles string with only @X codes and no content", () => {
    const result = convertPcbColors("@X03@X05");
    expect(result).not.toContain("@X");
    expect(result).toContain("<span");
  });
});
