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
// GitHub Actions deploys on every push and is what actually reaches production.
// deploy.sh is the manual path. Both must retain chunks, or fixing one leaves
// the real deploys broken -- which is exactly what happened: deploy.sh was
// fixed first while CI kept deleting the previous build's chunks.
const ci = readFileSync(path.join(process.cwd(), ".github/workflows/github-actions.yml"), "utf8");

describe("CI deploy client-chunk retention", () => {
  /** The rsync invocation in the workflow whose destination contains `dest`. */
  function ciRsyncFor(dest: string): string {
    const lines = ci.split("\n");
    const hit = lines.findIndex(l => l.includes(dest) && !l.trim().startsWith("#"));
    if (hit === -1) throw new Error(`no CI rsync line for ${dest}`);
    let start = hit;
    while (start > 0 && lines[start - 1].trimEnd().endsWith("\\")) start--;
    return lines.slice(start, hit + 1).join(" ");
  }

  it("never deletes the previous build's client chunks", () => {
    expect(ciRsyncFor("$DEST/.next/static/")).not.toMatch(/--delete/);
  });

  it("still deletes stale standalone output, which must match the running server", () => {
    expect(ciRsyncFor("$SERVER:$DEST/")).toMatch(/--delete/);
  });

  it("protects the static directory from the standalone sync's --delete", () => {
    // The standalone sync targets $DEST (the ROOT) and the standalone output
    // contains no .next/static, so without this exclude rsync deletes the
    // server's whole static directory here -- a moment before the next step
    // re-adds only the current build. Making the static sync additive is
    // useless on its own; this is the step that was actually wiping chunks.
    expect(ciRsyncFor("$SERVER:$DEST/")).toMatch(/--exclude=(['"]?)\/\.next\/static\1/);
  });

  it("deploys the CSS and fonts nginx serves from the project root", () => {
    // nginx serves /assets/ and /fonts/ from the project root, not from
    // public/ (deploy/asciiarena.se-nginx.conf). CI synced only public/, so a
    // CSS change reached production ONLY when someone ran deploy.sh by hand --
    // a pushed stylesheet fix silently did nothing.
    expect(ci).toMatch(/assets\/ "\$SERVER:\$DEST\/assets\/"/);
    expect(ci).toMatch(/fonts\/ "\$SERVER:\$DEST\/fonts\/"/);
  });

  it("prunes retained chunks so they cannot accumulate forever", () => {
    const prune = /find \S*\.next\/static -type f -mtime \+(\d+) -delete/.exec(ci);
    expect(prune).not.toBeNull();
    expect(Number(prune![1])).toBeGreaterThanOrEqual(7);
  });
});

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
    // And `comm` itself compares using the locale on BSD, so pinning only the
    // sorts still reports present files as missing. This aborted a good deploy
    // even after the sorts were fixed.
    expect(deploy).toMatch(/LC_ALL=C comm -23/);
  });

  it("aborts before restarting rather than serving a build with missing assets", () => {
    const abort = deploy.slice(deploy.indexOf("STILL missing"));
    expect(abort).toMatch(/exit 1/);
    // The guard has to come before the service restart, or the broken build is
    // already live by the time it fires. deploy.sh no longer restarts inline:
    // it delegates to deploy/deploy_asciiarena.sh, which reloads nginx, checks
    // that the new chunks are servable and then restarts. Anchor on that call,
    // since that is what makes the build live.
    const restartTrigger = deploy.indexOf("bin/deploy_asciiarena.sh");
    expect(restartTrigger).toBeGreaterThan(-1);
    expect(deploy.indexOf("STILL missing")).toBeLessThan(restartTrigger);
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
