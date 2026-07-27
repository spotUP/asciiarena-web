// One-shot: apply database/2026-07-28_chat_participants_archived.sql.
// Idempotent (ADD COLUMN IF NOT EXISTS). Run once locally and once on the
// server:
//   node scripts/apply-chat-archive-migration.mjs
//
// Talks to MariaDB directly rather than through the generated Prisma client:
// Prisma 7 emits TypeScript into lib/generated/prisma, so a plain .mjs cannot
// import it (scripts/apply-polls-migration.mjs still tries and would now fail).
import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createConnection } from "mariadb";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = resolve(__dirname, "../database/2026-07-28_chat_participants_archived.sql");

const statements = readFileSync(sqlPath, "utf8")
  .split(/;\s*\n/)
  .map(s => s.split("\n").filter(line => !line.trim().startsWith("--")).join("\n").trim())
  .filter(s => s.length > 0);

const url = new URL(process.env.DATABASE_URL);
const conn = await createConnection({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ""),
});

try {
  for (const stmt of statements) {
    process.stdout.write("· " + stmt.slice(0, 70).replace(/\s+/g, " ") + " …\n");
    await conn.query(stmt);
  }
  const cols = await conn.query("SHOW COLUMNS FROM chat_participants LIKE 'archived_at'");
  console.log("\narchived_at present:", cols.length > 0 ? "yes" : "NO — migration did not apply");
} finally {
  await conn.end();
}
