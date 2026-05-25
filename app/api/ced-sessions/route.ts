import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CED_SESSIONS_URL = "https://hippoplayer.se/cygnus/sessions";

export interface CedUser {
  nick: string;
  color: string;
}

export interface CedDocument {
  id: string;
  name: string;
  users: CedUser[];
}

export interface CedSessionsData {
  documents: CedDocument[];
}

export async function GET() {
  try {
    const res = await fetch(CED_SESSIONS_URL, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return NextResponse.json({ documents: [] });
    const data = (await res.json()) as CedSessionsData;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ documents: [] });
  }
}
