# serudio.github.io

Personal site: React + TypeScript + MUI, built with Vite, deployed to
GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`).

Read this before adding a page, route, or feature — it covers three
things that are easy to silently break: SEO, AdSense, and the eventual
domain move.

## SEO

- This is a client-rendered SPA. Non-JS crawlers and social share bots
  (Facebook/Twitter/LinkedIn previews, etc.) only ever see the **static**
  `index.html` — they don't execute `src/components/Seo.tsx`
  (react-helmet-async). So:
  - Keep `index.html`'s title/description/canonical/OG/Twitter/JSON-LD
    tags accurate for the **home page** — that's what search engines and
    link previews actually index.
  - Per-route overrides via `<Seo />` only benefit real browsers and
    JS-rendering crawlers (Googlebot). Treat them as a bonus, not the
    source of truth.
  - If the site grows real content-heavy pages where ranking matters
    beyond the home page, revisit this — move to prerendering/SSG (e.g.
    Astro, vite-plugin-ssr, or a prerender build step) so every route
    ships real HTML.
- `public/robots.txt` and `public/sitemap.xml` are **generated**, not
  hand-edited — see `scripts/generate-seo-files.ts` (runs automatically
  via the `predev`/`prebuild` npm scripts). It pulls routes from
  `src/data/converters.ts` automatically, plus a small hardcoded list of
  static routes in the script — add any new *non-converter* route there.
- Every canonical/OG/sitemap URL is derived from `SITE_URL` in
  `src/config/site.ts` — never hardcode `https://serudio.github.io` (or
  any domain) elsewhere. See "Domain" below.
- Every new page needs exactly one `<h1>` and a distinct
  title/description. Every new image needs meaningful `alt` text.
- New converters: add one entry to `src/data/converters.ts` — the
  `/converters` index, its route, and the sitemap all pick it up
  automatically. Don't add converter routes anywhere else by hand.

## AdSense

- Client/publisher id: `ADSENSE_CLIENT_ID` in `src/config/site.ts`
  (currently `ca-pub-7505878489573686`). The loader script lives in
  `index.html`.
- `public/ads.txt` must always list this publisher id — if it's ever
  removed or the account changes, AdSense stops paying out. Don't delete
  it without updating the id there too.
- To add a real ad unit: create it in the AdSense dashboard, then use
  `<AdSlot slotId="..." />` (`src/components/AdSlot.tsx`) — don't
  hand-roll another `<ins class="adsbygoogle">` element or a second
  loader script. Placeholder slot ids (starting with `TODO`) are
  deliberately inert — replace the id, don't just remove the guard.
- Keep ad density reasonable and place ads where they can't be mistaken
  for navigation/content (AdSense policy) or hurt Core Web Vitals/layout
  stability (SEO). `ConverterPageLayout` already includes one ad slot per
  converter page — that's the intended density until told otherwise.
- `public/privacy.html` and `src/pages/PrivacyPage.tsx` describe
  AdSense's cookie use — keep both in sync if the ad setup changes.
- If EU/UK traffic starts to matter, AdSense requires a consent
  mechanism (a Google-certified CMP or Consent Mode) for personalized
  ads — not implemented yet. Flag this to the user before enabling
  personalized ads for EEA/UK visitors.

## Domain

- Currently deployed at the default GitHub Pages user domain:
  `https://serudio.github.io`. A custom domain is planned for later.
- When the custom domain is ready:
  1. Update `SITE_URL` in `src/config/site.ts` — this alone fixes
     canonical URLs, OG/Twitter tags, the sitemap, and robots.txt.
  2. Add a `public/CNAME` file with the new domain.
  3. Set the custom domain in GitHub repo Settings -> Pages.
  4. Re-verify the domain in Google Search Console and update the
     AdSense site list.
  5. Update the `google-site-verification` meta tag in `index.html` if
     Google issues a new one for the new domain.
- Don't hardcode the github.io URL anywhere new — always import
  `SITE_URL` from `src/config/site.ts`.
