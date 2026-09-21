import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { SITE_URL, SITE_NAME } from '../src/config/site'
import { converters } from '../src/data/converters'

/**
 * Gives every SPA route a real HTML file, so GitHub Pages answers it
 * with 200 instead of 404.
 *
 * WHY THIS EXISTS: GitHub Pages is a plain static file server with no
 * SPA rewrite. It only serves paths that exist as files, so a
 * client-rendered route like /converters/deposit had no file behind it
 * and returned a hard 404 — to visitors following a link, and to
 * Googlebot, which dropped every one of those URLs from the index.
 * (/privacy escaped this only because public/privacy.html happens to be
 * a real file.)
 *
 * HOW IT WORKS: GitHub Pages resolves an extensionless request to the
 * matching .html file — /converters is served from converters.html — so
 * writing one file per route is enough. Each file is a copy of the built
 * index.html with that route's title/description/canonical/OG tags
 * substituted in, which means non-JS crawlers and social share bots get
 * correct per-page tags for the first time (until now they only ever saw
 * the home page's — see the SEO NOTE in index.html). The app itself is
 * unchanged: React Router reads the URL and renders the right page.
 *
 * Files are named <route>.html rather than <route>/index.html on
 * purpose: the latter makes GitHub Pages 301-redirect /converters to
 * /converters/, and a sitemap URL shouldn't go through a redirect.
 *
 * Runs as `postbuild` (see package.json), after Vite has written dist/.
 * Static text here is Ukrainian only, like index.html and privacy.html —
 * see CLAUDE.md, section "Internationalization".
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const dist = path.join(root, 'dist')

const uk = JSON.parse(
  readFileSync(path.join(root, 'src/i18n/locales/uk.json'), 'utf8'),
) as Record<string, unknown>

/** Resolves a dotted i18n key, e.g. 'converters.deposit.title'. */
function translate(key: string): string {
  const value = key.split('.').reduce<unknown>((node, part) => {
    if (node && typeof node === 'object') return (node as Record<string, unknown>)[part]
    return undefined
  }, uk)

  if (typeof value !== 'string') {
    throw new Error(`Missing Ukrainian translation for "${key}" — add it to src/i18n/locales/uk.json`)
  }
  return value
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface RoutePage {
  /** Route path as it appears in the sitemap, e.g. '/converters'. */
  route: string
  /** Page title, before the " | serudio" suffix that <Seo /> also adds. */
  title: string
  description: string
}

// '/' is dist/index.html itself and '/privacy' is the hand-written
// public/privacy.html, so neither is generated here.
const pages: RoutePage[] = [
  {
    route: '/converters',
    title: translate('converters.heading'),
    description: translate('converters.seoDescription'),
  },
  ...converters.map((converter) => ({
    route: `/converters/${converter.slug}`,
    title: translate(converter.titleKey),
    description: translate(converter.seoDescriptionKey),
  })),
]

const template = readFileSync(path.join(dist, 'index.html'), 'utf8')

/** Swaps the value of a single tag, leaving the rest of the head intact. */
function replaceAttribute(html: string, pattern: RegExp, value: string): string {
  if (!pattern.test(html)) {
    throw new Error(`dist/index.html no longer matches ${pattern} — update scripts/generate-route-pages.ts`)
  }
  return html.replace(pattern, `$1${escapeHtml(value)}$2`)
}

for (const page of pages) {
  // Matches the "<title> | serudio" form the client-side <Seo /> renders,
  // so the static tag and the rendered one agree.
  const fullTitle = `${page.title} | ${SITE_NAME}`
  const url = `${SITE_URL}${page.route}`

  let html = template
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(fullTitle)}</title>`)
  html = replaceAttribute(html, /(<meta name="description" content=")[^"]*(")/, page.description)
  html = replaceAttribute(html, /(<link rel="canonical" href=")[^"]*(")/, url)
  html = replaceAttribute(html, /(<meta property="og:title" content=")[^"]*(")/, fullTitle)
  html = replaceAttribute(html, /(<meta property="og:description" content=")[^"]*(")/, page.description)
  html = replaceAttribute(html, /(<meta property="og:url" content=")[^"]*(")/, url)
  html = replaceAttribute(html, /(<meta name="twitter:title" content=")[^"]*(")/, fullTitle)
  html = replaceAttribute(html, /(<meta name="twitter:description" content=")[^"]*(")/, page.description)

  const file = path.join(dist, `${page.route.replace(/^\//, '')}.html`)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, html)
}

console.log(`Generated ${pages.length} route pages in dist/ (${pages.map((p) => p.route).join(', ')})`)
