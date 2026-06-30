import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { buildLogoRows } from "@/lib/collyLogoRows";
import { normalizeHandle, type EntityDicts } from "@/lib/handleMatch";

const colly = (...lines: string[]) => lines.join("\n");

const EMPTY_DICTS: EntityDicts = { artists: [], crews: [], users: [] };

// A captioned logo: the crew name sits on a divider/caption line just above the
// art (blank-separated), exactly how collys label logos.
const CAPTIONED = colly(
  "uP rOUGH",
  "",
  "_/\\__ ___ AAA ___ __/\\_",
  "|  | /   \\ |  | /   \\| |",
  "|__| \\___/ |__| \\___/|_|",
  "|  | /   \\ |  | /   \\| |",
  "|__| \\___/ |__| \\___/|_|",
  "",
);

describe("buildLogoRows", () => {
  it("extracts a captioned logo and resolves it to a crew", () => {
    const dicts: EntityDicts = { ...EMPTY_DICTS, crews: [{ id: 20, norm: normalizeHandle("up rough") }] };
    const rows = buildLogoRows(7, CAPTIONED, dicts);
    expect(rows.length).toBe(1);
    expect(rows[0].colly_id).toBe(7);
    expect(normalizeHandle(rows[0].label)).toBe("uprough");
    expect(rows[0].label_norm.split(" ")).toContain("uprough");
    expect(rows[0].crew_id).toBe(20);
    expect(rows[0].artist_id).toBeNull();
    expect(rows[0].start_line).toBeGreaterThanOrEqual(0);
  });

  it("indexes a 'X for Y' logo under X only — search key excludes the recipient", () => {
    const forCaption = colly(
      "up rough for spot",
      "",
      "_/\\__ ___ AAA ___ __/\\_",
      "|  | /   \\ |  | /   \\| |",
      "|__| \\___/ |__| \\___/|_|",
      "|  | /   \\ |  | /   \\| |",
      "|__| \\___/ |__| \\___/|_|",
      "",
    );
    const dicts: EntityDicts = { ...EMPTY_DICTS, crews: [{ id: 20, norm: normalizeHandle("up rough") }] };
    const rows = buildLogoRows(7, forCaption, dicts);
    expect(rows.length).toBe(1);
    expect(rows[0].crew_id).toBe(20); // up rough = the logo
    expect(rows[0].label_norm.split(" ")).toContain("uprough"); // recipient "spot" excluded from search key
    expect(rows[0].label_norm).not.toContain("spot");
  });

  it("does not store uncaptioned / generic 'Logo N' rows", () => {
    // Same art but no caption above it -> label falls back to generic -> skipped.
    const noCaption = colly(
      "_/\\__ ___ AAA ___ __/\\_",
      "|  | /   \\ |  | /   \\| |",
      "|__| \\___/ |__| \\___/|_|",
      "|  | /   \\ |  | /   \\| |",
      "|__| \\___/ |__| \\___/|_|",
      "",
    );
    const rows = buildLogoRows(7, noCaption, EMPTY_DICTS);
    for (const r of rows) expect(r.label).not.toMatch(/^Logo \d+$/);
  });

  it("produces clean, structurally-valid rows on a real colly (junk filtered out)", () => {
    const txt = readFileSync(join(__dirname, "fixtures", "colly-spn-russ.txt"), "latin1");
    const rows = buildLogoRows(1, txt, EMPTY_DICTS);
    // This colly's logos are uncaptioned art; its only caption lines are a BBS
    // phone number and scrolltext, which the filter drops. So 0+ clean rows.
    expect(Array.isArray(rows)).toBe(true);
    for (const r of rows) {
      expect(r.label.length).toBeGreaterThan(0);
      expect(r.label).not.toMatch(/^Logo \d+$/);
      expect(r.label.length).toBeLessThanOrEqual(120);
      expect(r.start_line).toBeGreaterThanOrEqual(0);
      // no scrolltext/phone-number junk survived
      expect(r.label).not.toMatch(/\d-\d{3}-\d/);
    }
  });
});

import { buildLogoRowsFromMap } from "@/lib/collyLogoRows";
import { normalizeHandle as nh } from "@/lib/handleMatch";

describe("buildLogoRowsFromMap (tagged collys)", () => {
  it("builds rows from explicit captions + resolves entities, recipient excluded", () => {
    const dicts = { artists: [{ id: 5, norm: nh("spot") }], crews: [{ id: 9, norm: nh("up rough") }], users: [] };
    const rows = buildLogoRowsFromMap(7, [
      { line: 8, caption: "spot for nexus" },
      { line: 22, caption: "up rough" },
    ], dicts);
    expect(rows.length).toBe(2);
    expect(rows[0].artist_id).toBe(5);          // spot resolved
    expect(rows[0].label_norm).not.toContain("nexus"); // recipient excluded
    expect(rows[0].start_line).toBe(7);         // 1-based 8 -> 0-based 7
    expect(rows[1].crew_id).toBe(9);            // up rough resolved
  });
});
