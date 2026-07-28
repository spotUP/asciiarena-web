import { rename, unlink, writeFile } from "fs/promises";
import path from "path";

/**
 * Write a file by creating a temporary one beside it and renaming over the
 * target.
 *
 * Two reasons, both of which bit us.
 *
 * PERMISSIONS. Overwriting a file needs write permission on THAT FILE. The
 * collections tree came from the old PHP site: every file is owned by www-data
 * with mode 755, so the group has no write bit, while the directories are
 * group-writable and the Next process (user `spot`) is in that group. Writing
 * in place therefore failed with EACCES on all 3657 existing .diz files, while
 * creating a new one worked -- an admin could add a description but never edit
 * one. rename() needs permission on the DIRECTORY, which we have, so this works
 * regardless of the mode of the file being replaced.
 *
 * ATOMICITY. These are irreplaceable archive files. An in-place write that dies
 * halfway leaves a truncated colly; a rename either happened or it did not.
 *
 * The temp file is created in the same directory on purpose: rename() is only
 * atomic within a filesystem, and /data is a different mount from /tmp.
 */
export async function writeFileAtomic(
  filePath: string,
  data: string | Uint8Array,
): Promise<void> {
  const dir = path.dirname(filePath);
  const tmp = path.join(dir, `.${path.basename(filePath)}.tmp-${process.pid}-${Date.now()}`);

  try {
    await writeFile(tmp, data);
    await rename(tmp, filePath);
  } catch (err) {
    // Never leave a stray .tmp behind in the archive; the write already failed,
    // so a failure to clean up is not worth reporting over the real error.
    await unlink(tmp).catch(() => {});
    throw err;
  }
}
