import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";

export interface CollyContentHit {
  filename: string;
  name: string | null;
  snippet: string; // first matching line for context
}

interface Row {
  filename: string;
  name: string | null;
  content_text: string | null;
}

// Turn a free query into a MySQL boolean-mode FULLTEXT expression: each word
// becomes a required (+) prefix term. Quotes/operators are stripped so user
// input can't break the AGAINST() syntax.
function booleanExpr(q: string): string {
  const words = q
    .replace(/[+\-><()~*"@]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  return words.map((w) => `+${w}*`).join(" ");
}

// Build a one-line snippet around the first matching term, for result context.
function snippetFor(content: string, q: string): string {
  const terms = q.toLowerCase().split(/\s+/).filter((w) => w.length >= 2);
  for (const line of content.split(/\r?\n/)) {
    const lower = line.toLowerCase();
    if (terms.some((t) => lower.includes(t))) {
      const trimmed = line.trim();
      if (trimmed) return trimmed.length > 120 ? trimmed.slice(0, 119) + "…" : trimmed;
    }
  }
  return "";
}

// Full-content search over the decoded colly text via the content_ft FULLTEXT
// index. Defensive: returns [] if the column/index doesn't exist yet (pre-migration).
export async function searchCollyContent(q: string, limit = 30): Promise<CollyContentHit[]> {
  const expr = booleanExpr(q);
  if (!expr) return [];
  try {
    const rows = await prisma.$queryRaw<Row[]>(Prisma.sql`
      SELECT filename, name, content_text
      FROM collys
      WHERE MATCH(content_text) AGAINST(${expr} IN BOOLEAN MODE)
      ORDER BY view_counter DESC
      LIMIT ${limit}
    `);
    return rows.map((r) => ({
      filename: r.filename,
      name: r.name,
      snippet: snippetFor(r.content_text ?? "", q),
    }));
  } catch {
    return [];
  }
}
