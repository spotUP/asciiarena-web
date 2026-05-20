import { NextResponse } from "next/server";

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
export const ARTIST_SORT_COLS = new Set(["nick", "crews"]);
export const CREW_SORT_COLS = new Set(["name", "acronym", "members_cnt", "releases_cnt", "rating"]);
export const BBS_SORT_COLS = new Set(["name", "sysop"]);
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
