import { NextResponse } from "next/server";

/**
 * Decode a dynamic route param defensively. Next.js 16 leaves some special
 * characters URL-encoded inside `params` (e.g. `^` → `%5E`) but our database
 * stores the decoded form, so a raw findFirst against the param misses the
 * row and notFound() fires for any nick/filename/name that contains one.
 * Safe to call on already-decoded input — decodeURIComponent is idempotent
 * for inputs without `%XX` sequences.
 */
export function decodeParam(raw: string): string {
  try { return decodeURIComponent(raw); } catch { return raw; }
}

export function urlsafe(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[\s!]+/g, "-")
    .replace(/[^-a-z0-9_]+/g, "")
    .replace(/-+$/g, "")
    .replace(/-+/g, "-");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function pluralize(a: string[], sep = " & ", innerSep = ", "): string {
  if (a.length < 3) return a.join(sep);
  const last = a[a.length - 1];
  return a.slice(0, -1).join(innerSep) + sep + last;
}

export function combinize(names: string, base: string, fallback = ""): string {
  if (!names) return fallback;
  const parts = names.split(/[&,]/).map((s) => s.trim()).filter(Boolean);
  const links = parts.map((n) => `<a href="${base}${urlsafe(n)}">${n}</a>`);
  return pluralize(links);
}

export async function notifyDiscord(webhookUrl: string, message: string) {
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "ASCII ARENA", content: message }),
    });
  } catch {
    // webhook failures are non-fatal
  }
}

const UPLOAD_WEBHOOK = process.env.DISCORD_UPLOAD_WEBHOOK ?? "";
const REQUEST_WEBHOOK = process.env.DISCORD_REQUEST_WEBHOOK ?? "";

export { UPLOAD_WEBHOOK, REQUEST_WEBHOOK };

// Whitelisted sort columns per entity — prevents ORDER BY injection
export const COLLY_SORT_COLS = new Set(["name", "filename", "cdate", "filesize", "artists", "crews"]);
export const ARTIST_SORT_COLS = new Set(["nick", "crews", "rating", "country"]);
export const CREW_SORT_COLS = new Set(["name", "acronym", "members_cnt", "releases_cnt", "rating"]);
export const BBS_SORT_COLS = new Set(["name", "sysop", "country", "online"]);
export const APP_SORT_COLS = new Set(["name", "filename", "author", "timestamp"]);
export const MAG_SORT_COLS = new Set(["name", "filename", "author", "timestamp"]);
export const REQ_SORT_COLS = new Set(["title", "status", "timestamp"]);

export function safeSort(col: string, allowed: Set<string>, fallback: string): string {
  return allowed.has(col) ? col : fallback;
}

export function apiError(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

export function apiOk(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

// Compact relative time ("now", "5m", "2h", "3d", "2w", "4mo", "1y") for the
// elapsed time since a Unix timestamp (seconds). `nowMs` is injected so it's
// pure and testable. Used by the Last Callers widget — relative time is always
// monotonic in a newest-first list and sidesteps timezone confusion entirely.
export function formatRelativeTime(unixSeconds: number, nowMs: number): string {
  const diff = Math.max(0, Math.floor(nowMs / 1000) - Math.floor(unixSeconds));
  if (diff < 60) return diff <= 1 ? "now" : `${diff}s`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(diff / 3600);
  if (h < 24) return `${h}h`;
  const d = Math.floor(diff / 86400);
  if (d < 7) return `${d}d`;
  const w = Math.floor(diff / 604800);
  if (w < 5) return `${w}w`;
  const mo = Math.floor(diff / 2592000);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(diff / 31536000)}y`;
}
