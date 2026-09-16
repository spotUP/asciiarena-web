// Pure BBS-name matching for the Demozoo text-ad import.
// No imports: unit-tested in __tests__/bbsAdMatch.test.ts without a database.

export interface BbsCandidate {
  id: number;
  name: string | null;
  demozoo_id: number | null;
}

/**
 * Canonical form for cross-database BBS names. Demozoo qualifies names
 * with dialing codes ("Akira (416)", "State of Euphoria (713)") that
 * asciiarena rows do not carry; diacritics and punctuation vary on both
 * sides. Everything lossy about this function is reported by the import
 * script's miss list for human review - it never silently merges.
 */
export function normalizeBbsName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type BbsMatch =
  | { kind: "demozoo_id"; id: number }
  | { kind: "name"; id: number }
  | { kind: "create" }
  | { kind: "ambiguous"; ids: number[] };

export function matchBbs(demozooId: number, demozooName: string, candidates: BbsCandidate[]): BbsMatch {
  const byId = candidates.find((c) => c.demozoo_id === demozooId);
  if (byId) return { kind: "demozoo_id", id: byId.id };
  const want = normalizeBbsName(demozooName);
  if (!want) return { kind: "create" };
  const hits = candidates.filter((c) => c.name && normalizeBbsName(c.name) === want);
  if (hits.length === 1) return { kind: "name", id: hits[0].id };
  if (hits.length > 1) return { kind: "ambiguous", ids: hits.map((h) => h.id) };
  return { kind: "create" };
}
