/**
 * Central site configuration. Nothing here is secret (the AdSense id is
 * already public in ads.txt and was already visible in the old
 * index.html), so these are plain constants — not env vars.
 *
 * index.html can't import TypeScript directly, so vite.config.ts imports
 * this same file and substitutes __SITE_URL__ / __SITE_NAME__ /
 * __DEFAULT_TITLE__ / __DEFAULT_DESCRIPTION__ / __ADSENSE_CLIENT_ID__
 * placeholders in index.html with these values at build/dev time (see
 * the `html-site-config` plugin there). scripts/generate-seo-files.ts
 * also imports this file directly for robots.txt/sitemap.xml. So there
 * is exactly one place to edit these values.
 *
 * NOTE (domain): the site is on the default GitHub Pages domain today
 * (https://serudio.github.io). A custom domain is planned. When it's
 * ready, change SITE_URL below — that alone updates canonical URLs, Open
 * Graph/Twitter tags, the sitemap, and robots.txt. Then also add
 * public/CNAME, set the domain in GitHub repo Settings -> Pages, and
 * re-verify it in Search Console and the AdSense site list. Full
 * checklist: see CLAUDE.md.
 */
export const SITE_URL = 'https://serudio.github.io'
export const SITE_NAME = 'serudio'
export const DEFAULT_TITLE = 'serudio | Особисті проєкти та інструменти'
export const DEFAULT_DESCRIPTION =
  'serudio — особисті проєкти: Todo Cloud, Book Rent, та онлайн-конвертери одиниць виміру.'
export const ADSENSE_CLIENT_ID = 'ca-pub-7505878489573686'
export const LOCALE = 'uk_UA'
