// Fuzzy resolution of a logo's extracted label (e.g. "uP rOUGH",
// "3o ! bROwAlliA 4 nUkLEUs.nFO : o3") to artist / crew / user records.
//
// v1 is auto-fuzzy: normalize both sides to lowercase alphanumerics, then match
// the entity against the label's word-tokens (and short joins of consecutive
// tokens, so multi-word names like "up rough" -> "uprough" match). A curated
// alias/override table can layer on in v2 without changing this logic.

// Label words that are structural noise, not handles.
const NOISE = new Set([
  "nfo", "diz", "txt", "ascii", "ansi", "presents", "present", "pres",
  "colly", "collection", "coll", "logo", "logos", "by", "the", "and",
  "of", "in", "for", "crew", "group", "proudly", "presentz",
  // section / UI / scrolltext words that recur as captions but aren't handles
  "request", "requests", "upload", "uploads", "download", "downloads",
  "menu", "credits", "greetings", "greets", "info", "information", "stage",
  "name", "sof", "eof", "oof", "called", "members", "total", "loading",
  "index", "main", "intro", "outro", "news", "thanks",
]);

// Entities shorter than this (after normalization) are skipped in v1 — symbol/
// 2-char handles (z!o, etc.) need the v2 alias table to match safely.
const MIN_ENTITY_LEN = 3;

export function normalizeHandle(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Split a label into normalized tokens, dropping noise words and pure numbers
// (logo counters / years). Digits are a common connector in divider captions
// ("spot 4 asciiarena" = "spot FOR asciiarena", "x 2 y") and get collapsed by
// label extraction, so each alnum token is ALSO split on digit runs — yielding
// the bare handle ("spot", "asciiarena") while still keeping the whole token
// (so a genuinely digit-bearing handle like "g80" survives too).
export function labelTokens(label: string): string[] {
  const base = label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const out = new Set<string>();
  const keep = (t: string) => {
    if (t.length >= 2 && !/^\d+$/.test(t) && !NOISE.has(t)) out.add(t);
  };
  for (const t of base) {
    keep(t); // whole token, e.g. "g80" or "browallia4nukleus"
    for (const part of t.split(/[0-9]+/)) keep(part); // letter-runs: "spot", "asciiarena"
  }
  return [...out];
}

// Tokens plus joins of up to 3 consecutive tokens, so a multi-word entity name
// ("up rough" -> "uprough") matches a label that spaces the words out.
function candidateStrings(tokens: string[]): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < tokens.length; i++) {
    let joined = "";
    for (let j = i; j < i + 3 && j < tokens.length; j++) {
      joined += tokens[j];
      out.add(joined);
    }
  }
  return out;
}

export interface EntityRef {
  id: number;
  norm: string; // normalizeHandle(nick|name|acronym)
}

export interface EntityDicts {
  artists: EntityRef[];
  crews: EntityRef[];
  users: EntityRef[];
}

export interface ResolveResult {
  artist_id?: number;
  crew_id?: number;
  user_id?: number;
}

function matchEntity(cands: Set<string>, entities: EntityRef[]): number | undefined {
  // Exact match only (a token, or a join of up to 3 consecutive tokens for
  // multi-word names). Substring/containment matching was dropped — it
  // over-matched short common names ("style" -> stylez/freestyle/lifestyle).
  // Word-spacing + digit-splitting already break glued labels into real tokens,
  // so exact matching covers the legitimate cases without the false positives.
  for (const e of entities) {
    if (e.norm.length < MIN_ENTITY_LEN) continue;
    if (cands.has(e.norm)) return e.id;
  }
  return undefined;
}

// Whether an UNRESOLVED label is plausibly a real logo handle (vs. scrolltext
// prose, ASCII-art fragments, section words, or 2-char noise). Resolved labels
// are always kept; this gates the rest so the catalog isn't drowned in junk.
export function isLikelyLogoLabel(label: string): boolean {
  const tokens = labelTokens(label);
  if (tokens.length < 1 || tokens.length > 4) return false; // 0 = all noise; >4 = prose
  const norm = normalizeHandle(label);
  if (norm.length < 3 || norm.length > 15) return false; // too short / run-on sentence
  const letters = (norm.match(/[a-z]/g) || []).length;
  if (letters < 3) return false; // "hs", "oO", counter strings
  const nonSpace = label.replace(/\s/g, "").length;
  if (nonSpace === 0 || norm.length / nonSpace < 0.5) return false; // mostly symbols => art
  return true;
}

// Tidy a raw divider label for display: strip leading/trailing logo counters
// ("61 |", "| 16", "o5 !", ": 13") and surrounding separator punctuation,
// collapse whitespace, cap length. Best-effort — internal "4"="for" glue can't
// be un-collapsed, but it reads far better than the raw caption.
export function cleanLabel(label: string): string {
  let s = label
    .replace(/^\s*[oO0-9]{1,3}\s*[-|.!:>＞<＜]+\s*/, "")
    .replace(/\s*[-|.!:>＞<＜]+\s*[oO0-9]{1,3}\s*$/, "")
    .replace(/^[\s|.!:>＞<＜*=_-]+/, "")
    .replace(/[\s|.!:>＞<＜*=_-]+$/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  if (!s) s = label.trim();
  return s.length > 48 ? s.slice(0, 47).trimEnd() + "…" : s;
}

// Scene dividers dedicate logos with "X for Y" / "X 4 Y" / "X 2 Y" — the logo
// is X; Y is the recipient (a greeting), NOT a logo of Y. So entity resolution
// only looks at the SUBJECT: everything before the first for/to connector.
// ("speed for xcz" resolves speed, not xcz.)
const CONNECTORS = new Set(["for", "to", "4", "2"]);
export function subjectPart(label: string): string {
  const words = label.split(/\s+/).filter(Boolean);
  const i = words.findIndex((w) => CONNECTORS.has(normalizeHandle(w)));
  return (i >= 0 ? words.slice(0, i) : words).join(" ");
}

export function resolveEntities(label: string, dicts: EntityDicts): ResolveResult {
  const tokens = labelTokens(subjectPart(label));
  if (!tokens.length) return {};
  const cands = candidateStrings(tokens);
  const result: ResolveResult = {};
  const artist = matchEntity(cands, dicts.artists);
  const crew = matchEntity(cands, dicts.crews);
  const user = matchEntity(cands, dicts.users);
  if (artist !== undefined) result.artist_id = artist;
  if (crew !== undefined) result.crew_id = crew;
  if (user !== undefined) result.user_id = user;
  return result;
}
