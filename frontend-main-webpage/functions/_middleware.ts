const ALLOWED_ORIGINS = new Set([
  'https://www.useclinicos.com',
  'https://useclinicos.com',
  'https://app.useclinicos.com',
]);

function isAllowedOrigin(origin: string) {
  if (ALLOWED_ORIGINS.has(origin)) return true;

  // Allow localhost in dev (any port).
  // Examples: http://localhost:5173, http://localhost:3000
  if (/^http:\/\/localhost(?::\d+)?$/.test(origin)) return true;
  if (/^http:\/\/127\.0\.0\.1(?::\d+)?$/.test(origin)) return true;

  return false;
}

function withCorsHeaders(headers: Headers, origin: string) {
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Vary', 'Origin');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  headers.set('Access-Control-Max-Age', '86400');
  return headers;
}

export const onRequest: PagesFunction = async (context) => {
  const origin = context.request.headers.get('Origin') || '';
  const allowed = origin && isAllowedOrigin(origin);

  // Handle preflight early.
  if (context.request.method === 'OPTIONS') {
    if (!allowed) return new Response(null, { status: 204 });
    const headers = withCorsHeaders(new Headers(), origin);
    return new Response(null, { status: 204, headers });
  }

  const response = await context.next();
  if (!allowed) return response;

  const headers = new Headers(response.headers);
  withCorsHeaders(headers, origin);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};


