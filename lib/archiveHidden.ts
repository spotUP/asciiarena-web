import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

// Admin-curated list of archive entries hidden from the rendered art listing,
// for when content detection lets unrelated files through. Stored as a single
// JSON file (no DB migration), mapping archive filename -> [entry names].
// Recompute the collections path here rather than importing from ./archive to
// avoid a circular import (archive.ts consults these helpers).
const COLLECTIONS_PATH = process.env.COLLECTIONS_PATH ?? path.join(process.cwd(), "collections");
const HIDDEN_FILE = path.join(COLLECTIONS_PATH, "hidden-archive-entries.json");

type HiddenMap = Record<string, string[]>;

function readMap(): HiddenMap {
  try {
    if (!existsSync(HIDDEN_FILE)) return {};
    return JSON.parse(readFileSync(HIDDEN_FILE, "utf-8")) as HiddenMap;
  } catch {
    return {};
  }
}

function writeMap(map: HiddenMap): void {
  writeFileSync(HIDDEN_FILE, JSON.stringify(map, null, 2), "utf-8");
}

export function getHiddenEntries(filename: string): string[] {
  return readMap()[filename] ?? [];
}

export function setEntryHidden(filename: string, entry: string, hidden: boolean): void {
  const map = readMap();
  const list = new Set(map[filename] ?? []);
  if (hidden) list.add(entry);
  else list.delete(entry);
  if (list.size > 0) map[filename] = [...list];
  else delete map[filename];
  writeMap(map);
}
