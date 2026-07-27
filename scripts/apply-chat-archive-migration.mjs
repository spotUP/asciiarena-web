// One-shot: apply database/2026-07-28_chat_participants_archived.sql.
// Idempotent (the SQL guards on information_schema — the database is MySQL 8,
// where MariaDB's ADD COLUMN IF NOT EXISTS is a syntax error). Run once
// locally and once on the server:
//   node scripts/apply-chat-archive-migration.mjs
//
// Already applied to production on 2026-07-28 via the mysql CLI, because the
// deployed standalone bundle carries no database driver.
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { runSqlFile } from "./lib/run-sql-file.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

await runSqlFile(
  resolve(__dirname, "../database/2026-07-28_chat_participants_archived.sql"),
  async (conn) => {
    const cols = await conn.query("SHOW COLUMNS FROM chat_participants LIKE 'archived_at'");
    console.log("\narchived_at present:", cols.length > 0 ? "yes" : "NO — migration did not apply");
  },
);
