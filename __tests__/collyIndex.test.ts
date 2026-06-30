import { describe, it, expect } from "vitest";
import { parseCollyIndex } from "@/lib/collyIndex";

const colly = (...lines: string[]) => lines.join("\n");

const INDEX_BLOCK = colly(
  "     ¦     o1> STATiC DESC           o7> THE ROGUELANDS                |",
  "     ¦     o2> ATTENTiON TO DETAiL   o8> DUB DESC                      |",
  "    _¦     o3> REViSiON              o9> LOONiES                       ¦",
  "    \\/     o4> REMEDY                1o> ASCii ARENA                   :",
  "     :     o5> MYSTiC DESC           11> ARCLiTE                       ·",
  "     :     o6> TWiLiGHT              12> ASSEMBLY 2o11                 :",
);

describe("parseCollyIndex", () => {
  it("parses a two-column oN> index with o-as-zero numbering", () => {
    const idx = parseCollyIndex(INDEX_BLOCK);
    expect(idx).toHaveLength(12);
    expect(idx[0]).toEqual({ num: 1, name: "STATiC DESC" });
    expect(idx[6]).toEqual({ num: 7, name: "THE ROGUELANDS" });
    expect(idx[9]).toEqual({ num: 10, name: "ASCii ARENA" }); // "1o>" -> 10
    expect(idx[11]).toEqual({ num: 12, name: "ASSEMBLY 2o11" }); // year stays in the name
    expect(idx.map((e) => e.num)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("returns [] for art that isn't an index", () => {
    const art = colly(
      "  _/\\__/\\__ ___ /\\/\\ ___ __/\\__/\\_",
      "  |  ||  | /   \\ |  | /   \\ |  ||  |",
      "  |__||__| \\___/ |__| \\___/ |__||__|",
    );
    expect(parseCollyIndex(art)).toEqual([]);
  });

  it("requires a near-contiguous sequence starting near 1 (rejects stray matches)", () => {
    // Two unrelated "N> x" lines far apart in number -> not an index.
    const stray = colly("43> whatever", "  art line here ___", "88> something else");
    expect(parseCollyIndex(stray)).toEqual([]);
  });
});
