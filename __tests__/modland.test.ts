import { describe, it, expect } from "vitest";
import { chooseRandomFormat, randomOffset, UADE_RANDOM_FORMATS, type ModlandFormatCount } from "@/lib/modland";

// Realistic-ish counts (Protracker dwarfs the rest; TFMX is tiny). Includes a
// PC format that must never be chosen, since UADE can't play it.
const COUNTS: ModlandFormatCount[] = [
  { format: "Protracker", count: 80591 },
  { format: "Fasttracker 2", count: 44239 }, // PC — not in the allowlist
  { format: "OctaMED MMD1", count: 2722 },
  { format: "Soundtracker", count: 1864 },
  { format: "OctaMED MMD0", count: 1443 },
  { format: "AHX", count: 1389 },
  { format: "Quartet ST", count: 863 },
  { format: "Delitracker Custom", count: 748 },
  { format: "TFMX", count: 736 },
  { format: "Oktalyzer", count: 448 },
];

function distribution(counts: ModlandFormatCount[], n = 2000): Record<string, number> {
  const hits: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    const c = chooseRandomFormat(counts, (i + 0.5) / n); // sweep rand evenly 0..1
    if (c) hits[c.format] = (hits[c.format] ?? 0) + 1;
  }
  return hits;
}

describe("chooseRandomFormat", () => {
  it("never picks a format outside the UADE allowlist", () => {
    const d = distribution(COUNTS);
    expect(d["Fasttracker 2"]).toBeUndefined();
    for (const f of Object.keys(d)) expect(UADE_RANDOM_FORMATS).toContain(f);
  });

  it("favors the largest format but does not let it dominate everything", () => {
    const d = distribution(COUNTS);
    const total = Object.values(d).reduce((a, b) => a + b, 0);
    const ptShare = d["Protracker"] / total;
    expect(ptShare).toBeGreaterThan(0.35); // clearly the plurality
    expect(ptShare).toBeLessThan(0.6); // but sqrt-dampened, not ~93% like linear
  });

  it("makes tiny formats rare instead of equally likely (the TFMX-spam bug)", () => {
    const d = distribution(COUNTS);
    const total = Object.values(d).reduce((a, b) => a + b, 0);
    const tfmxShare = d["TFMX"] / total;
    expect(tfmxShare).toBeLessThan(0.08); // was 1/6 ≈ 0.167 with equal weighting
    expect(tfmxShare).toBeGreaterThan(0); // still reachable
    // and it's picked far less often than Protracker
    expect(d["TFMX"]).toBeLessThan(d["Protracker"] / 5);
  });

  it("returns null when no allowed format has any modules", () => {
    expect(chooseRandomFormat([], 0.5)).toBeNull();
    expect(chooseRandomFormat([{ format: "Impulsetracker", count: 999 }], 0.5)).toBeNull();
    expect(chooseRandomFormat([{ format: "AHX", count: 0 }], 0.5)).toBeNull();
  });
});

describe("randomOffset", () => {
  it("spans the whole catalog (reaches deep offsets, not just the first page)", () => {
    const count = 80591, limit = 50;
    expect(randomOffset(count, limit, 0)).toBe(0);
    expect(randomOffset(count, limit, 0.999999)).toBeGreaterThan(80000); // reaches the end
    expect(randomOffset(count, limit, 0.5)).toBeGreaterThan(39000); // middle of the list
  });

  it("never overshoots so a full window of results remains", () => {
    const count = 80591, limit = 50;
    expect(randomOffset(count, limit, 1)).toBeLessThanOrEqual(count - limit);
  });

  it("returns 0 when the catalog is smaller than one page", () => {
    expect(randomOffset(30, 50, 0.9)).toBe(0);
  });
});
