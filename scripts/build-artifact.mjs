#!/usr/bin/env node
/**
 * Builds a single, self-contained HTML file of the home page for the hosted
 * review preview (a sandboxed page host that only serves one file).
 *
 *   npm run build:artifact   →   .artifact/index.html
 *
 * It runs the normal Astro build with ARTIFACT_BUILD=1 (noindex + the form
 * shows a "preview" notice instead of posting), then inlines CSS, JS, fonts
 * and images. The Netlify deployment does NOT use this file.
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const out = join(root, '.artifact');
const dist = join(out, 'dist');

execSync('npx astro build', { cwd: root, stdio: 'inherit', env: { ...process.env, ARTIFACT_BUILD: '1' } });

const mime = { '.woff2': 'font/woff2', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
const dataUri = (absPath) => {
  const type = mime[extname(absPath)];
  if (!type) throw new Error(`No MIME type for ${absPath}`);
  return `data:${type};base64,${readFileSync(absPath).toString('base64')}`;
};
const local = (ref) => join(dist, ref.replace(/^\//, ''));

let html = readFileSync(join(dist, 'index.html'), 'utf8');

// 1. Stylesheets → <style>, with fonts inlined
html = html.replace(/<link rel="stylesheet" href="(\/_astro\/[^"]+\.css)"\s*\/?>/g, (_, href) => {
  let css = readFileSync(local(href), 'utf8');
  css = css.replace(/url\((['"]?)(\/fonts\/[^'")]+)\1\)/g, (_m, _q, font) => `url(${dataUri(local(font))})`);
  return `<style>${css}</style>`;
});

// 2. Module script → inline
html = html.replace(/<script type="module" src="(\/_astro\/[^"]+\.js)"><\/script>/g, (_, src) => {
  const js = readFileSync(local(src), 'utf8').replace(/<\/script/gi, '<\\/script');
  return `<script type="module">${js}</script>`;
});

// 3. Images: prefer the WebP variant for <img> fallbacks, then inline every local image
html = html.replace(/(\/images\/[^"\s,]+)-(\d+)\.jpg/g, (m, base, w) => {
  const webp = `${base}-${w}.webp`;
  return existsSync(local(webp)) ? webp : m;
});
const cache = new Map();
html = html.replace(/\/images\/[^"\s,)]+\.(?:webp|jpg|png|svg)/g, (ref) => {
  if (!cache.has(ref)) cache.set(ref, dataUri(local(ref)));
  return cache.get(ref);
});

// 4. Remove head tags the preview host provides or cannot use
html = html
  .replace(/<link rel="preload"[^>]*>/g, '')
  .replace(/<link rel="manifest"[^>]*>/g, '')
  .replace(/<link rel="(?:icon|apple-touch-icon)"[^>]*>/g, '')
  .replace(/<meta name="viewport"[^>]*>/g, '')
  .replace(/<meta charset="[^"]*"\s*\/?>/g, '');

// 5. The host wraps the page in its own <html>/<head>/<body>
html = html
  .replace(/<!doctype html>/i, '')
  .replace(/<html[^>]*>/i, '')
  .replace(/<\/html>/i, '')
  .replace(/<head>/i, '')
  .replace(/<\/head>/i, '')
  .replace(/<body[^>]*>/i, '')
  .replace(/<\/body>/i, '');

html = html.replace(/<title>[^<]*<\/title>/, '');
const preamble = [
  '<title>In Time Accounting Centre</title>',
  '<meta name="claude:viewport-fit-sides" content="cover">',
  `<link rel="icon" href="${dataUri(join(dist, 'favicon.svg'))}" type="image/svg+xml">`,
  "<script>document.documentElement.lang='hy';</script>",
].join('\n');

mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'index.html'), `${preamble}\n${html.trim()}\n`);
const size = Buffer.byteLength(readFileSync(join(out, 'index.html')));
console.log(`✓ .artifact/index.html written (${(size / 1024).toFixed(0)} KB)`);
