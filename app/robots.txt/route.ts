export async function GET() {
  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: https://freelons.xyz/sitemap.xml
`;
  return new Response(body, { headers: { "Content-Type": "text/plain" } });
}
