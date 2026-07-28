import { urlsafe } from "@/lib/utils";

/**
 * Topic URLs are "readable-title-<id>". The id suffix is what makes them
 * unique, so two topics with the same title in one board never collide and no
 * uniqueness retry loop is needed at insert time.
 */

const MAX_SLUG_TEXT = 100;

export function topicSlug(title: string, id: number): string {
  // urlsafe() can return "" for a title made entirely of punctuation, and it
  // strips trailing dashes — so slice first, then strip again, then fall back.
  const text = urlsafe(title).slice(0, MAX_SLUG_TEXT).replace(/-+$/g, "");
  return `${text || "topic"}-${id}`;
}

/**
 * Recover the topic id from a slug. Returns null for anything that does not end
 * in "-<digits>", so a hand-typed URL 404s instead of loading topic NaN.
 */
export function parseTopicId(slug: string): number | null {
  const m = /-(\d+)$/.exec(slug);
  if (!m) return null;
  const id = Number(m[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
