# In Time Accounting Centre — website

Armenian-language website for **In Time Accounting Centre** (Ին Թայմ հաշվապահական կենտրոն), Yerevan.
Static site built with [Astro](https://astro.build) and [GSAP](https://gsap.com); ready to deploy on Netlify.

- Animated hero illustration (SVG + CSS, plays without JavaScript)
- Scroll-driven sections, subtle parallax, process timeline with a sticky illustration
- Interactive service tabs, service finder that pre-fills the inquiry form
- Inquiry form via Netlify Forms, with a WhatsApp alternative
- Accessible: keyboard support, visible focus, `prefers-reduced-motion` respected, content readable without animations
- SEO: titles, descriptions, Open Graph image, `AccountingService` structured data, sitemap and robots

## Requirements

- Node.js **22.12 or newer** (see `.nvmrc`)
- npm (the committed `package-lock.json` pins every dependency)

## Local development

```bash
npm ci            # install exact dependency versions
npm run dev       # http://localhost:4321
```

## Production build

```bash
npm run build         # outputs the static site to dist/
npm run preview       # serves dist/ locally at http://localhost:4321
npm run check:links   # verifies every local link, asset and #anchor in dist/
```

## Deploying to Netlify

Everything is configured in `netlify.toml`. In Netlify: **Add new project → Import an existing project →
GitHub → this repository**. The settings are read from the file:

| Setting | Value |
| --- | --- |
| Branch to deploy | the branch that holds this code (currently `claude/elegant-turing-p4tuti`; merge it into `main` first if you prefer `main` as production) |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node version | 22 (set by `NODE_VERSION` in `netlify.toml`) |

### One-time setup after the first deploy

1. **Enable form detection** — *Project configuration → Forms → Enable form detection*, then trigger a
   new deploy (*Deploys → Trigger deploy*). Netlify then registers the form named `inquiry`.
2. **Form notifications** — *Project configuration → Forms → Form notifications → Add notification →
   Email notification*, and enter the address that should receive inquiries.
3. **Custom domain (optional)** — add it under *Domain management*. Then set the environment variable
   `SITE_URL` (e.g. `https://www.example.am`) and redeploy, so canonical URLs, the sitemap and social
   previews use the final domain. Without it, Netlify's own site URL is used automatically.

Until form detection is enabled, the form shows an honest error message and points visitors to the
phone numbers and WhatsApp; the "Send via WhatsApp" button works regardless.

### Search-engine indexing

- Production deploys are indexable (`index, follow`; `robots.txt` allows crawling and lists the sitemap).
- Deploy previews, branch deploys, local builds and the review preview are `noindex` and `robots.txt` disallows crawling.
- To keep production hidden as well (e.g. before launch), set the environment variable `NOINDEX=true`.

## Editing content

All business facts and Armenian copy live in **`src/data/site.ts`** — phones, address, hours, services,
the service finder, process steps, FAQ, the "about" text and the Instagram highlights. Edit text there and
redeploy; the layout adapts automatically.

Before adding new claims (years, numbers, credentials, reviews), check them against a public source and
record them in `RESEARCH.md`.

Images:

| Folder | Content |
| --- | --- |
| `public/images/brand/` | Logo (traced vector of the official logo), mark, favicon |
| `public/images/team/` | Photos from the company's own Instagram reels (`-480/-720` WebP + JPG fallback) |
| `public/images/insights/` | Covers of the Instagram reels shown in "Գիտելիք" |
| `public/images/og-image.png` | Social sharing image (1200×630) |

To replace a photo, keep the same file names and sizes (or update `src/data/site.ts`).

## Project structure

```
src/
  data/site.ts          all content and business facts
  components/           page sections (Hero, Services, Finder, Process, …)
  layouts/Base.astro    <head>, SEO, structured data
  pages/                index, thanks (no-JS form fallback), 404, robots.txt, sitemap.xml
  scripts/              ui.ts (interactions), motion.ts (GSAP), form.ts (form)
  styles/global.css     design tokens, typography, buttons
public/                 fonts, images, icons, manifest
scripts/                check-build.mjs, build-artifact.mjs
netlify.toml            build, headers, redirects
RESEARCH.md             sources, verified facts, open questions
```

## Review preview

`npm run build:artifact` creates `.artifact/index.html`, a single self-contained copy of the home page used
for the hosted review preview. In that copy the form does not submit (it explains this and offers WhatsApp).
It is not used by Netlify and is not committed.

## Licences

- Fonts: Noto Serif Armenian, Noto Sans Armenian — SIL Open Font License 1.1 (`public/fonts/OFL-*.txt`).
- GSAP 3 is free for commercial use under the GSAP standard licence.
