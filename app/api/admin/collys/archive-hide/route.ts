import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { setEntryHidden } from "@/lib/archiveHidden";

export async function POST(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const body = await request.json().catch(() => ({}));
  const filename = body.filename as string | undefined;
  const entry = body.entry as string | undefined;
  const hidden = body.hidden as boolean | undefined;
  if (!filename || !entry || typeof hidden !== "boolean") {
    return apiError("filename, entry and hidden are required", 400);
  }

  try {
    setEntryHidden(filename, entry, hidden);
    return apiOk({ status: true });
  } catch (e) {
    return apiError("Failed to update hidden entries: " + String(e), 500);
  }
}
