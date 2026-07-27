// One-shot: apply prisma/polls_migration.sql.
// Idempotent (CREATE TABLE IF NOT EXISTS). Run once locally and on the server:
//   node scripts/apply-polls-migration.mjs
//
// Previously imported the generated Prisma client and had been broken since
// Prisma 7 started emitting TypeScript — lib/generated/prisma/client.js does
// not exist, so the script died with ERR_MODULE_NOT_FOUND before running a
// single statement. It now shares the driver-direct runner with the other
// migrations.
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { runSqlFile } from "./lib/run-sql-file.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

await runSqlFile(
  resolve(__dirname, "../prisma/polls_migration.sql"),
  async (conn) => {
    const tables = await conn.query("SHOW TABLES LIKE 'poll%'");
    console.log("\nTables present:", tables.map(row => Object.values(row)[0]));
  },
);
