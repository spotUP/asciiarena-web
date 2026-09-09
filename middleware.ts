import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://hippoplayer.se',
  'https://www.hippoplayer.se',
];

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
  'Vary': 'Origin',
};

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') ?? '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin);
  const pathname = request.nextUrl.pathname;

  // Public bot API: unauthenticated GETs, usable from any origin (chatbots,
  // browser widgets, curl). Wide-open CORS with no credentials.
  const isPublicV1 = pathname === '/api/v1/openapi' || pathname.startsWith('/api/v1/') || pathname === '/api/v1';
  if (isPublicV1) {
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    const res = NextResponse.next();
    res.headers.set('Access-Control-Allow-Origin', '*');
    return res;
  }

  if (request.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 200 });
    if (isAllowed) {
      res.headers.set('Access-Control-Allow-Origin', origin);
      for (const [k, v] of Object.entries(CORS_HEADERS)) res.headers.set(k, v);
    }
    return res;
  }

  const res = NextResponse.next();
  if (isAllowed) {
    res.headers.set('Access-Control-Allow-Origin', origin);
    for (const [k, v] of Object.entries(CORS_HEADERS)) res.headers.set(k, v);
  }
  return res;
}

export const config = {
  matcher: '/api/:path*',
};
