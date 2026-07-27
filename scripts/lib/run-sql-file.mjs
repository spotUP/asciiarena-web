// Shared runner for the one-shot .sql migrations in database/ and prisma/.
//
// Talks to the database directly with the mariadb driver (which speaks to the
// MySQL 8 server fine) rather than through the generated Prisma client: Prisma
// 7 emits TypeScript into lib/generated/prisma, so a plain .mjs cannot import
// it — every migration script that tried died with ERR_MODULE_NOT_FOUND.
//
// Statements are split on a semicolon at end-of-line, so a semicolon inside a
// string literal or a JSON default does not split a statement in half.

import "dotenv/config";
import { readFileSync } from "node:fs";
import { createConnection } from "mariadb";

export function readStatements(sqlPath) {
  return readFileSync(sqlPath, "utf8")
    .split(/;\s*\n/)
    .map(s => s.split("\n").filter(line => !line.trim().startsWith("--")).join("\n").trim())
    .filter(s => s.length > 0);
}

export async function connect() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set (is .env present?)");
  const url = new URL(process.env.DATABASE_URL);
  return createConnection({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    // Migrations run statements the driver would otherwise reject as multi-
    // statement (PREPARE/EXECUTE pairs); they are executed one at a time here.
    multipleStatements: false,
  });
}

/**
 * Apply every statement in `sqlPath`, then run `verify` (if given) with the
 * open connection so each migration can prove it actually landed.
 */
export async function runSqlFile(sqlPath, verify) {
  const statements = readStatements(sqlPath);
  const conn = await connect();
  try {
    for (const stmt of statements) {
      process.stdout.write("· " + stmt.slice(0, 70).replace(/\s+/g, " ") + " …\n");
      await conn.query(stmt);
    }
    if (verify) await verify(conn);
  } finally {
    await conn.end();
  }
}
