// One-shot: apply database/2026-07-31_self_addressed_messages.sql.
//
// Clears `to_id`/`postedto` on messages a user addressed to themselves, after
// copying every affected row to messages_self_addressed_backup. Idempotent: the
// second run finds no rows left to repair and the INSERT IGNORE re-adds nothing.
//
//   node scripts/apply-self-addressed-repair.mjs
//
// Needs a reachable DATABASE_URL. The dev .env points at 127.0.0.1:3306, which
// is an SSH tunnel to the server -- open it first, or run the SQL on the server
// with the mysql CLI, which is how this was applied to production.
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { runSqlFile } from "./lib/run-sql-file.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

await runSqlFile(
  resolve(__dirname, "../database/2026-07-31_self_addressed_messages.sql"),
  async (conn) => {
    const [left] = await conn.query(
      "SELECT COUNT(*) AS n FROM messages WHERE from_id IS NOT NULL AND from_id = to_id"
    );
    const [saved] = await conn.query(
      "SELECT COUNT(*) AS n FROM messages_self_addressed_backup"
    );
    console.log(`\nself-addressed rows remaining: ${left.n} (expected 0)`);
    console.log(`rows in backup table: ${saved.n}`);
  },
);
