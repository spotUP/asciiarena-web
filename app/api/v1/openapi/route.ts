import { NextResponse } from "next/server";
import { buildOpenApi } from "@/lib/api-v1-openapi";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(buildOpenApi(), {
    headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=3600" },
  });
}
