import type { APIRoute } from 'astro';
import { allowIndexing } from '../lib/indexing';

export const GET: APIRoute = ({ site }) => {
  const body = allowIndexing
    ? `User-agent: *\nAllow: /\nDisallow: /thanks/\n\nSitemap: ${new URL('/sitemap.xml', site).href}\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
