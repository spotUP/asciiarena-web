import { chmodSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";

import { afterEach, describe, expect, it } from "vitest";

import { writeFileAtomic } from "@/lib/atomic-write";

/**
 * Regression: editing a colly's description failed in production with
 *
 *   EACCES: permission denied, open '.../COR-VNS/COR-VNS.TXT.diz'
 *
 * The collections tree came from the old PHP site: files are owned by www-data
 * with mode 755 (no group write), directories are group-writable, and the Next
 * process runs as a user in that group. So it could CREATE a .diz but never
 * overwrite one -- an admin could add a description and never edit it. All 3657
 * existing .diz files were affected.
 */
let dir: string | null = null;

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = null;
});

function makeDir(): string {
  dir = mkdtempSync(path.join(tmpdir(), "atomic-write-"));
  return dir;
}

describe("writeFileAtomic", () => {
  it("replaces a file the process may not write to", () => {
    const d = makeDir();
    const target = path.join(d, "COR-VNS.TXT.diz");
    writeFileSync(target, "old description");
    chmodSync(target, 0o444); // exactly the prod condition: not writable by us

    return writeFileAtomic(target, "new description").then(() => {
      expect(readFileSync(target, "utf-8")).toBe("new description");
    });
  });

  it("creates a file that does not exist yet", async () => {
    const d = makeDir();
    const target = path.join(d, "fresh.diz");

    await writeFileAtomic(target, "hello");

    expect(readFileSync(target, "utf-8")).toBe("hello");
  });

  it("leaves no temporary files behind", async () => {
    const d = makeDir();
    const target = path.join(d, "a.diz");

    await writeFileAtomic(target, "one");
    await writeFileAtomic(target, "two");

    expect(readdirSync(d)).toEqual(["a.diz"]);
  });

  it("cleans up its temporary file when the write fails", async () => {
    const d = makeDir();
    // A directory where the target name is itself a directory: the rename
    // cannot succeed, so this exercises the failure path.
    const target = path.join(d, "adir");
    const { mkdirSync } = await import("fs");
    mkdirSync(target);

    await expect(writeFileAtomic(target, "data")).rejects.toBeTruthy();

    expect(readdirSync(d)).toEqual(["adir"]);
  });

  it("writes binary content unchanged", async () => {
    const d = makeDir();
    const target = path.join(d, "art.ans");
    const bytes = new Uint8Array([0x1b, 0x5b, 0x30, 0x6d, 0xdb, 0x00, 0xff]);

    await writeFileAtomic(target, bytes);

    expect(new Uint8Array(readFileSync(target))).toEqual(bytes);
    expect(existsSync(target)).toBe(true);
  });
});
