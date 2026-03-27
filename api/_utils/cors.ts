export function corsHeaders(origin: string): Record<string, string> {
  const allowed = process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173';
  const allowedOrigins = [allowed, 'http://localhost:5173', 'http://localhost:3000'];
  const responseOrigin = allowedOrigins.includes(origin) ? origin : allowed;
  return {
    'Access-Control-Allow-Origin': responseOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}
