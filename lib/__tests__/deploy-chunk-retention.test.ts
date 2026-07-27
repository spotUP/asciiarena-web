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

  it("verifies every client asset landed instead of trusting one rsync", () => {
    // A deploy was seen reporting success while six of the build's chunks
    // never reached the server. Missing is the same user-visible failure as
    // stale, and it stays invisible until someone clicks the thing that
    // lazy-loads it.
    expect(deploy).toMatch(/verify_static/);
    expect(deploy).toMatch(/comm -23 .*aa-static-local.*aa-static-remote/);
  });

  it("compares both file lists in the same collation", () => {
    // macOS ships BSD sort, the server GNU sort, and their default locales
    // order punctuation differently. comm assumes both inputs share a
    // collation, so mismatched sorts report present files as missing — and
    // Turbopack names chunks with exactly the punctuation they disagree on.
    // This aborted two good deploys before it was understood.
    // No dotAll flag: this repo targets ES2017, which rejects it.
    const localSort = /find \. -type f \| LC_ALL=C sort[\s\S]*aa-static-local/;
    const remoteSort = /find \. -type f \| LC_ALL=C sort[\s\S]*aa-static-remote/;
    expect(deploy).toMatch(localSort);
    expect(deploy).toMatch(remoteSort);
    // Neither side may sort without pinning the collation.
    expect(deploy).not.toMatch(/find \. -type f \| sort/);
  });

  it("aborts before restarting rather than serving a build with missing assets", () => {
    const abort = deploy.slice(deploy.indexOf("STILL missing"));
    expect(abort).toMatch(/exit 1/);
    // The guard has to come before the service restart, or the broken build is
    // already live by the time it fires.
    expect(deploy.indexOf("STILL missing")).toBeLessThan(deploy.indexOf("Restarting service"));
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
