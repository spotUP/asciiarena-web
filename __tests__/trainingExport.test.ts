import { describe, it, expect, vi } from "vitest";

const { queryRaw } = vi.hoisted(() => ({ queryRaw: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { $queryRaw: queryRaw } }));

import { exportTrainingData, toJsonl } from "@/lib/trainingExport";

describe("exportTrainingData", () => {
  it("maps a gold row to a labelled record with sliced text lines", async () => {
    queryRaw.mockResolvedValueOnce([
      {
        filename: "spot-arena.txt",
        type: "ASCII",
        start_line: 2,
        end_line: 4,
        label: "spot",
        manual: 1,
        artist_id: 7,
        crew_id: null,
        user_id: null,
        content_text: ["intro", "", "  _ spot _", " / logo \\", " \\____/", "after"].join("\n"),
      },
    ]);

    const recs = await exportTrainingData();
    expect(recs).toHaveLength(1);
    expect(recs[0]).toMatchObject({
      filename: "spot-arena.txt",
      manual: true,
      entity: { kind: "artist", id: 7 },
      lines: ["  _ spot _", " / logo \\", " \\____/"],
    });
  });

  it("serialises records as one JSON object per line", () => {
    const jsonl = toJsonl([
      { filename: "a.txt", type: "ASCII", start_line: 0, end_line: 0, label: "x", manual: true, entity: null, lines: ["x"] },
      { filename: "b.txt", type: "ASCII", start_line: 1, end_line: 1, label: "y", manual: false, entity: { kind: "crew", id: 3 }, lines: ["y"] },
    ]);
    const lines = jsonl.split("\n");
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).filename).toBe("a.txt");
    expect(JSON.parse(lines[1]).entity).toEqual({ kind: "crew", id: 3 });
  });
});
