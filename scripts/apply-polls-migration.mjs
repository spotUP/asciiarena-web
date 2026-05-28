// One-shot: apply prisma/polls_migration.sql via the existing Prisma client.
// Idempotent (CREATE TABLE IF NOT EXISTS). Run once locally + on the server.
//   node scripts/apply-polls-migration.mjs
import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { PrismaClient } from "../lib/generated/prisma/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = resolve(__dirname, "../prisma/polls_migration.sql");
const sql = readFileSync(sqlPath, "utf8");

// Split on semicolons that end a statement (ignore those inside JSON defaults etc — none here).
const statements = sql
  .split(/;\s*\n/)
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith("--"));

const adapter = new PrismaMariaDb({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

for (const stmt of statements) {
  // Strip leading -- comment lines but keep the rest of the statement.
  const cleaned = stmt
    .split("\n")
    .filter(line => !line.trim().startsWith("--"))
    .join("\n")
    .trim();
  if (!cleaned) continue;
  process.stdout.write("· " + cleaned.slice(0, 60).replace(/\s+/g, " ") + " …\n");
  await prisma.$executeRawUnsafe(cleaned);
}

const tables = await prisma.$queryRawUnsafe("SHOW TABLES LIKE 'poll%'");
console.log("\nTables present:", tables);
await prisma.$disconnect();
