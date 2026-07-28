import { MAX_MENTIONS_PER_POST } from "@/lib/forum/types";

/**
 * Pull "@nick" candidates out of a post body. Pure: it returns strings to look
 * up, and lib/forum/db.ts decides which of them are real accounts. Same split
 * as lib/handleMatch.ts — extraction here, dictionary there.
 *
 * Scene nicks are not identifiers. z!o, ^pQ^, bR41n, -=hazard=- are all real
 * shapes, so an [A-Za-z0-9_] character class would silently fail to mention
 * half the site. The rule is instead: everything up to whitespace or sentence
 * punctuation.
 *
 * Known limitation, deliberately not fixed: a nick containing a space cannot be
 * mentioned. The alternative is @{braced syntax}, which nobody would type.
 */

// Stop at whitespace, a second @, and the punctuation that ends a clause.
const MENTION_RE = /@([^\s@,;:()[\]{}"'<>]{1,30})/g;

// Trailing punctuation people write after a nick without meaning it as part of
// the nick: "thanks @spot!" and "ask @mo9, he knows".
const TRAILING = /[.!?,:;-]+$/;

export function extractMentionCandidates(body: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (raw: string) => {
    const key = raw.toLowerCase();
    if (!raw || seen.has(key)) return;
    seen.add(key);
    out.push(raw);
  };

  for (const m of body.matchAll(MENTION_RE)) {
    // An @ that follows a non-space character is an email address or a path,
    // not a mention. "mail me at user@example.com" must notify nobody.
    const at = m.index ?? 0;
    if (at > 0 && !/\s/.test(body[at - 1])) continue;

    const raw = m[1];
    // Emit the token as written AND with trailing punctuation stripped, so
    // whichever one is a real nick resolves. A nick may legitimately end in
    // "!" (z!o-style handles), which is why both go in.
    push(raw);
    push(raw.replace(TRAILING, ""));

    // A post of 500 @s must not turn into a 500-entry SQL IN list. Two
    // candidates per mention, so cap at three times the notify ceiling.
    if (out.length >= MAX_MENTIONS_PER_POST * 3) break;
  }

  return out;
}
