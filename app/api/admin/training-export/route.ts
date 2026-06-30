import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { exportTrainingData, toJsonl } from "@/lib/trainingExport";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Download the logo catalog as a JSONL training dataset. Gold (manual) labels by
// default; ?weak=1 also includes detected labels. Authorized by admin rank or a
// REINDEX_SECRET token (so it can be pulled from the host shell).
async function authorized(req: NextRequest): Promise<boolean> {
  const token = req.nextUrl.searchParams.get("token");
  if (token && process.env.REINDEX_SECRET && token === process.env.REINDEX_SECRET) return true;
  const session = await auth();
  return (session?.user as { rank?: string } | undefined)?.rank === "Admin";
}

export async function GET(req: NextRequest) {
  if (!(await authorized(req))) return new Response("forbidden", { status: 403 });

  const manualOnly = req.nextUrl.searchParams.get("weak") !== "1";
  const records = await exportTrainingData(manualOnly);
  const body = toJsonl(records);

  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Content-Disposition": `attachment; filename="asciiarena-logos-${manualOnly ? "gold" : "all"}.jsonl"`,
      "X-Record-Count": String(records.length),
    },
  });
}
