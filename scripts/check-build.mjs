#!/usr/bin/env node
/**
 * Post-build sanity check (no dependencies):
 *  - every local href/src/srcset in the generated HTML points to a real file
 *  - every in-page #anchor link has a matching id
 *  - the Netlify form markup is present
 * Usage: npm run build && npm run check:links
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;
if (!existsSync(dist)) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

const htmlFiles = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.html')) htmlFiles.push(p);
  }
};
walk(dist);

const problems = [];
const resolveLocal = (ref, fromFile) => {
  const clean = ref.split('#')[0].split('?')[0];
  if (!clean) return true;
  const base = clean.startsWith('/') ? join(dist, clean) : join(dirname(fromFile), clean);
  if (existsSync(base) && statSync(base).isFile()) return true;
  if (existsSync(join(base, 'index.html'))) return true;
  return false;
};

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const rel = file.replace(dist, '/');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

  const refs = [
    ...[...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/\ssrcset="([^"]+)"/g)].flatMap((m) => m[1].split(',').map((s) => s.trim().split(/\s+/)[0])),
  ];

  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|viber:|data:|javascript:)/.test(ref)) continue;
    if (ref.startsWith('#')) {
      if (ref.length > 1 && !ids.has(ref.slice(1))) problems.push(`${rel}: missing anchor target ${ref}`);
      continue;
    }
    if (!resolveLocal(ref, file)) problems.push(`${rel}: missing file ${ref}`);
  }
}

const index = readFileSync(join(dist, 'index.html'), 'utf8');
if (!/data-netlify="true"/.test(index) || !/name="form-name" value="inquiry"/.test(index)) {
  problems.push('index.html: Netlify form markup not found');
}

if (problems.length) {
  console.error(`✗ ${problems.length} problem(s):\n` + problems.map((p) => `  - ${p}`).join('\n'));
  process.exit(1);
}
console.log(`✓ ${htmlFiles.length} HTML files checked — all local links, assets and anchors resolve; Netlify form present.`);
