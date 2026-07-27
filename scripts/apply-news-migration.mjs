// One-shot: apply database/2026-07-28_news.sql.
// Idempotent (CREATE TABLE IF NOT EXISTS). Run once locally and on the server:
//   node scripts/apply-news-migration.mjs
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { runSqlFile } from "./lib/run-sql-file.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

await runSqlFile(
  resolve(__dirname, "../database/2026-07-28_news.sql"),
  async (conn) => {
    const tables = await conn.query("SHOW TABLES LIKE 'news%'");
    console.log("\nTables present:", tables.map(row => Object.values(row)[0]));
  },
);
