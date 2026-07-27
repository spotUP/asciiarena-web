import { describe, it, expect } from "vitest";
import { countrySlug, matchCountryValues, displayCountryName } from "@/lib/countrySlug";

describe("countrySlug", () => {
  it("slugs a multi-word country", () => {
    expect(countrySlug("Bosnia and Herzegovina")).toBe("bosnia-and-herzegovina");
  });

  it("ignores casing and surrounding whitespace", () => {
    expect(countrySlug("  GERMANY ")).toBe("germany");
    expect(countrySlug("Germany")).toBe("germany");
  });
});

describe("matchCountryValues — one slug, every spelling stored over the years", () => {
  const stored = ["Germany", " Germany", "germany", "Sweden", null, "", "   "];

  it("collects every stored spelling of the requested country", () => {
    expect(matchCountryValues("germany", stored)).toEqual(["Germany", " Germany", "germany"]);
  });

  it("does not bleed into a different country", () => {
    expect(matchCountryValues("sweden", stored)).toEqual(["Sweden"]);
  });

  it("skips empty and null values rather than matching them to an empty slug", () => {
    expect(matchCountryValues("", stored)).toEqual([]);
  });

  it("returns nothing for a country nobody is from", () => {
    expect(matchCountryValues("atlantis", stored)).toEqual([]);
  });
});

describe("displayCountryName", () => {
  it("picks the commonest spelling", () => {
    expect(displayCountryName(["Germany", "germany", "Germany"])).toBe("Germany");
  });

  it("trims the value it shows", () => {
    expect(displayCountryName([" Germany "])).toBe("Germany");
  });

  it("is empty for no values", () => {
    expect(displayCountryName([])).toBe("");
  });
});
