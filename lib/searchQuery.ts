// Parse a search box query into field-scoped terms + free text.
//
//   spot                       -> { free: "spot" }                (search everything)
//   artist:spot                -> { artist: "spot", isScoped: true }
//   crew:"up rough" old        -> { crew: "up rough", free: "old", isScoped: true }
//   content:breakdance         -> { content: "breakdance", isScoped: true }
//
// Recognized fields (+ short aliases) route to one category each; anything not
// prefixed with a known field falls into `free` and searches all categories.
// Pure (no DB) so it's unit-testable.

export interface ParsedSearch {
  artist?: string;
  crew?: string;
  member?: string;
  logo?: string;
  content?: string;
  name?: string;
  free: string;
  isScoped: boolean;
}

// field token -> canonical scope key
const FIELD_ALIASES: Record<string, keyof Omit<ParsedSearch, "free" | "isScoped">> = {
  artist: "artist",
  by: "artist",
  crew: "crew",
  group: "crew",
  member: "member",
  user: "member",
  logo: "logo",
  handle: "logo",
  content: "content",
  text: "content",
  in: "content",
  name: "name",
  title: "name",
  file: "name",
};

export function parseSearchQuery(raw: string): ParsedSearch {
  const result: ParsedSearch = { free: "", isScoped: false };
  const freeParts: string[] = [];
  // Re-tokenize so a quoted value after a field: stays attached:
  //   crew:"up rough"  -> one token  crew:up rough
  const re = /(\w+):"([^"]*)"|(\w+):(\S+)|"([^"]*)"|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const field = (m[1] ?? m[3])?.toLowerCase();
    const fieldVal = m[2] ?? m[4];
    const bare = m[5] ?? m[6];
    if (field && FIELD_ALIASES[field]) {
      const key = FIELD_ALIASES[field];
      const val = (fieldVal ?? "").trim();
      if (val) {
        result[key] = result[key] ? `${result[key]} ${val}` : val;
        result.isScoped = true;
      }
    } else if (field && fieldVal !== undefined) {
      // unknown field: keep the whole "foo:bar" as free text
      freeParts.push(`${field}:${fieldVal}`);
    } else if (bare !== undefined) {
      freeParts.push(bare);
    }
  }
  result.free = freeParts.join(" ").trim();
  return result;
}
