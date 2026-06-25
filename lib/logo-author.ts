// Shared author parsing for logo uploads. Both the public submit flow and the
// admin upload panel accept an optional author handle that should be trimmed
// before saving.

export function readLogoAuthor(input: unknown): string {
  if (input instanceof FormData) {
    return String(input.get("author") ?? "").trim();
  }
  if (input && typeof input === "object" && "author" in input) {
    return String((input as { author?: unknown }).author ?? "").trim();
  }
  return "";
}
