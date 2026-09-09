/**
 * Central site configuration, sourced from the VITE_* variables in `.env`
 * at the repo root. Those same variables fill in the static tags in
 * index.html via Vite's built-in %VITE_X% HTML env replacement, so the
 * canonical/OG/JSON-LD tags there and the values used at runtime here
 * (e.g. in <Seo />) never drift apart — there is exactly one place to
 * edit: `.env`.
 *
 * NOTE (domain): the site is on the default GitHub Pages domain today
 * (https://serudio.github.io). A custom domain is planned. When it's
 * ready, change VITE_SITE_URL in `.env` — that alone updates canonical
 * URLs, Open Graph/Twitter tags, the sitemap, and robots.txt (see
 * scripts/generate-seo-files.mjs). Then also add public/CNAME, set the
 * domain in GitHub repo Settings -> Pages, and re-verify it in Search
 * Console and the AdSense site list. Full checklist: see CLAUDE.md.
 */
export const SITE_URL = import.meta.env.VITE_SITE_URL
export const SITE_NAME = import.meta.env.VITE_SITE_NAME
export const DEFAULT_TITLE = import.meta.env.VITE_DEFAULT_TITLE
export const DEFAULT_DESCRIPTION = import.meta.env.VITE_DEFAULT_DESCRIPTION
export const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID
export const LOCALE = 'uk_UA'
