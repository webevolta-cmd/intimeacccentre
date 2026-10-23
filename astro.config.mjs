// @ts-check
import { defineConfig } from 'astro/config';

/**
 * Canonical site URL.
 * - SITE_URL: set this in Netlify (Site configuration → Environment variables)
 *   once the custom domain is known, e.g. https://www.example.am
 * - URL: provided automatically by Netlify during builds (the site's main URL)
 */
const site = process.env.SITE_URL || process.env.URL || 'https://intimeacccentre.netlify.app';

export default defineConfig({
  site,
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
    inlineStylesheets: 'always',
  },
  outDir: process.env.ARTIFACT_BUILD ? './.artifact/dist' : './dist',
  compressHTML: true,
  devToolbar: { enabled: false },
});
