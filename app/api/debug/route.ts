import { NextRequest } from "next/server";
export async function GET(request: NextRequest) {
  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => { headers[k] = v; });
  return Response.json({ url: request.url, nextUrl: request.nextUrl.toString(), headers });
}
