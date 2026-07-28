/**
 * What a combobox should do with text the reader typed but never confirmed.
 *
 * The combobox only told its parent about a value when an option was clicked or
 * Enter was pressed. Typing a name and going straight to Submit dropped it
 * silently: collys were saved with no artist and no crew, and the only way to
 * attach them was to edit the colly afterwards and pick from the list.
 *
 * Blur is the missing commit point, but it must not invent entries: a field
 * that cannot create new options has to fall back to what it had rather than
 * accept free text.
 */
export interface CommitOptions {
  /** Whether this field may create values that are not in the list. */
  allowCreate: boolean;
}

/**
 * The value to commit on blur, or null to leave the field as it was.
 *
 * - exact match (case-insensitive) -> the option's canonical spelling, so
 *   "qba" becomes "qBa" rather than a second artist differing only in case
 * - no match, creation allowed -> the trimmed text
 * - no match, creation not allowed -> null, discard it
 * - empty -> null when there is nothing to clear, otherwise "" to clear
 */
export function resolveComboboxCommit(
  typed: string,
  current: string,
  options: readonly string[],
  { allowCreate }: CommitOptions,
): string | null {
  const trimmed = typed.trim();

  if (trimmed === "") {
    // Clearing the box is a deliberate act; honour it, but do not fire a
    // change when it was already empty.
    return current === "" ? null : "";
  }

  const exact = options.find(o => o.toLowerCase() === trimmed.toLowerCase());
  if (exact !== undefined) return exact === current ? null : exact;

  if (!allowCreate) return null;
  return trimmed === current ? null : trimmed;
}
