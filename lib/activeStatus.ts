// Activity status for artists and crews (`artists.active`, `crews.active`).
//
// The column accumulated three vocabularies over the years: the legacy PHP
// editor wrote "Active"/"Inactive", the admin crew editor wrote "Yes"/"No",
// the admin artist editor wrote "yes"/"no" — and the artist page printed the
// raw column, so profiles showed a bare "yes" where they should read "Active".
//
// This module is the single source of truth: one canonical vocabulary, one
// reader that understands every legacy spelling, one label formatter.

export const ACTIVE_STATUSES = ["Active", "Inactive", "Ex-member"] as const;
export type ActiveStatus = (typeof ACTIVE_STATUSES)[number];

/** Every legacy spelling ever written to the column, lowercased. */
const ALIASES: Record<string, ActiveStatus> = {
  "active": "Active",
  "yes": "Active",
  "y": "Active",
  "1": "Active",
  "true": "Active",
  "inactive": "Inactive",
  "no": "Inactive",
  "n": "Inactive",
  "0": "Inactive",
  "false": "Inactive",
  "ex-member": "Ex-member",
  "ex member": "Ex-member",
  "exmember": "Ex-member",
  "ex": "Ex-member",
};

/**
 * Canonical status for a raw column value, or null when it is empty or
 * unrecognised (so callers can render their own placeholder).
 */
export function normalizeActiveStatus(raw: string | null | undefined): ActiveStatus | null {
  if (raw == null) return null;
  const key = raw.trim().toLowerCase();
  if (!key) return null;
  return ALIASES[key] ?? null;
}

/** Display label for a profile page. `fallback` covers unset/unknown values. */
export function activeStatusLabel(raw: string | null | undefined, fallback = "-"): string {
  return normalizeActiveStatus(raw) ?? fallback;
}
