import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

// Regression: every deploy produced "Failed to load chunk ... from module" for
// anyone with the site already open.
//
// Cause: deploy.sh rsynced .next/ with --delete, which removed the PREVIOUS
// build's content-hashed client chunks. A loaded page still references the old
// filenames, and code-split chunks (next/dynamic, route segments) are fetched
// lazily — often minutes later, when the user clicks. The request 404s and the
// interaction silently never happens.

const deploy = readFileSync(path.join(process.cwd(), "deploy.sh"), "utf8");

/** The rsync invocation whose destination path contains `dest`. */
function rsyncFor(dest: string): string {
  const lines = deploy.split("\n");
  const hit = lines.findIndex(l => l.includes(dest) && !l.trim().startsWith("#"));
  if (hit === -1) throw new Error(`no rsync line for ${dest}`);
  // Walk back over the backslash-continued invocation.
  let start = hit;
  while (start > 0 && lines[start - 1].trimEnd().endsWith("\\")) start--;
  return lines.slice(start, hit + 1).join(" ");
}

describe("deploy client-chunk retention", () => {
  it("never deletes the previous build's client chunks", () => {
    const staticSync = rsyncFor("/.next/static/");
    expect(staticSync).not.toMatch(/--delete/);
  });

  it("still deletes stale server-side build output, which must match the running process", () => {
    const serverSync = rsyncFor("/.next/");
    expect(serverSync).toMatch(/--delete/);
  });

  it("excludes static from the deleting sync, so that sync cannot remove chunks either", () => {
    // rsync does not delete excluded paths on the receiver, so the exclude is
    // what actually protects the previous build's chunks here.
    const serverSync = rsyncFor("/.next/");
    expect(serverSync).toMatch(/--exclude=(['"]?)static\1/);
  });

  it("prunes retained chunks on a window long enough to outlive a browsing session", () => {
    // Retention without pruning fills a disk that is already at 90 percent.
    const prune = /find\s+\S*\.next\/static\s+-type f\s+-mtime \+(\d+)\s+-delete/.exec(deploy);
    expect(prune).not.toBeNull();
    expect(Number(prune![1])).toBeGreaterThanOrEqual(7);
  });
});

describe("chunk reload guard", () => {
  const guard = readFileSync(
    path.join(process.cwd(), "components/ui/ChunkReloadGuard.tsx"),
    "utf8",
  );

  it("recognises the wordings webpack, Turbopack and the browser each use", () => {
    for (const phrase of [
      "ChunkLoadError",
      "Loading chunk",
      "Failed to load chunk",
      "Loading CSS chunk",
      "dynamically imported module",
    ]) {
      expect(guard).toContain(phrase);
    }
  });

  it("listens for both thrown errors and rejected dynamic imports", () => {
    // A failed import() surfaces as an unhandled rejection, not a window error.
    expect(guard).toMatch(/addEventListener\("error"/);
    expect(guard).toMatch(/addEventListener\("unhandledrejection"/);
  });

  it("cannot reload in a loop when reloading does not help", () => {
    expect(guard).toMatch(/RELOAD_COOLDOWN_MS/);
    expect(guard).toMatch(/sessionStorage/);
  });

  it("is mounted in the root layout", () => {
    const layout = readFileSync(path.join(process.cwd(), "app/layout.tsx"), "utf8");
    expect(layout).toMatch(/import ChunkReloadGuard from "@\/components\/ui\/ChunkReloadGuard"/);
    expect(layout).toMatch(/<ChunkReloadGuard \/>/);
  });
});
