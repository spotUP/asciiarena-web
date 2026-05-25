import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  // Ensure x-forwarded-host reflects the public hostname so NextAuth
  // constructs correct redirect URLs behind the Apache reverse proxy.
  const host = request.headers.get("host");
  if (host) headers.set("x-forwarded-host", host);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
