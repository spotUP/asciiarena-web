import { PrismaClient } from "./generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// unstable_cache uses JSON.stringify; BigInt from $queryRaw would throw without this.
// Convert BigInt to Number — safe for all values in this codebase (counts, IDs, timestamps).
(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function () {
  return Number(this);
};

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const url = new URL(process.env.DATABASE_URL!);
  // Pool options via search params — the adapter's URL path preserves them
  // and mariadb.createPool() reads them from the connection string.
  url.searchParams.set("connectionLimit", "5");
  url.searchParams.set("connectTimeout", "10000");
  url.searchParams.set("acquireTimeout", "20000");
  url.searchParams.set("idleTimeout", "60000");
  url.searchParams.set("resetAfterUse", "true");
  const adapter = new PrismaMariaDb(url.toString());
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Always persist — ensures a single pool across any module re-evaluation
globalForPrisma.prisma = prisma;
