import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { SITE_URL, SITE_NAME } from '../src/config/site'
import { converters } from '../src/data/converters'
import { fallbackQuotes, type Quote } from '../src/data/quotes'
import { RESTRICTED_SLUGS } from '../src/data/quoteCategories'

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
  /**
   * Output path inside dist/, when the default <route>.html is wrong.
   * Only /books/ needs this — see the comment on its entry below.
   */
  file?: string
  /** Replaces the home page's WebSite JSON-LD for this route. */
  jsonLd?: Record<string, unknown>
  /** Emits robots noindex — the page exists to be linked, not found. */
  noIndex?: boolean
}

/**
 * Quotes for the per-quote permalink pages.
 *
 * Read straight from the REST endpoint rather than through supabase-js:
 * this script needs six columns once, and that is not worth a client.
 * Without credentials — a local build, since .env is not loaded into a
 * tsx script's process.env — it falls back to the bundled list, so the
 * build never depends on the database being awake.
 */
async function loadQuotes(): Promise<Quote[]> {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return fallbackQuotes

  try {
    const response = await fetch(
      `${url}/rest/v1/quotes?select=slug,text_uk,text_en,author,source,categories` +
        `&published=eq.true&deleted_at=is.null&order=sort_order`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(10_000),
      },
    )
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const rows = (await response.json()) as {
      slug: string
      text_uk: string
      text_en: string | null
      author: string | null
      source: string | null
      categories: string[] | null
    }[]

    if (rows.length === 0) throw new Error('empty table')

    return rows.map((row) => ({
      id: row.slug,
      slug: row.slug,
      uk: row.text_uk,
      en: row.text_en ?? undefined,
      author: row.author ?? undefined,
      source: row.source ?? undefined,
      categories: row.categories ?? [],
    }))
  } catch (error) {
    console.warn(`  quotes: using bundled list (${(error as Error).message})`)
    return fallbackQuotes
  }
}

const quotes = await loadQuotes()

// '/' is dist/index.html itself and '/privacy' is the hand-written
// public/privacy.html, so neither is generated here.
const pages: RoutePage[] = [
  {
    // The ONE exception to the <route>.html rule above: this page was
    // indexed by Google at /books/ (with the slash) while it lived in its
    // own repo, and its canonical has always said so. Writing
    // books/index.html keeps that exact URL answering 200 and /books
    // redirecting to it, exactly as before the move — books.html would
    // turn the indexed URL into a 404.
    route: '/books/',
    file: 'books/index.html',
    title: translate('books.seoTitle'),
    description: translate('books.seoDescription'),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Library',
      name: translate('books.title'),
      description: translate('books.seoDescription'),
      url: `${SITE_URL}/books/`,
      inLanguage: 'uk',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Львів',
        addressCountry: 'UA',
      },
      areaServed: 'Львів',
    },
  },
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
  {
    route: '/travel/recommended',
    title: translate('travel.recommendedTitle'),
    description: translate('travel.recommendedSeoDescription'),
  },
  {
    // Only here so a shared link resolves to a real file and a 200
    // instead of falling through to 404.html. The trip itself is
    // fetched client-side from the token in the query string, so there
    // is nothing page-specific to put in these tags — and nothing that
    // should be indexed.
    route: '/travel/share',
    title: translate('travel.sharedTitle'),
    description: translate('travel.sharedSeoDescription'),
    noIndex: true,
  },
  {
    route: '/quotes',
    title: translate('quotes.title'),
    description: translate('quotes.seoDescription'),
  },
  // One file per quote so a shared link resolves and previews correctly.
  // The quote itself is the description: it is the whole content of the
  // page and exactly what a link preview should show. Quotes carrying a
  // restricted category are noindex, and none of these are in the
  // sitemap — see scripts/generate-seo-files.ts.
  ...quotes.map((quote) => ({
    route: `/quotes/${quote.slug}`,
    title: translate('quotes.title'),
    description: quote.author ? `${quote.uk} — ${quote.author}` : quote.uk,
    noIndex: quote.categories.some((slug) => RESTRICTED_SLUGS.includes(slug)),
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

  if (page.noIndex) {
    html = replaceAttribute(html, /(<meta name="robots" content=")[^"]*(")/, 'noindex, follow')
  }

  if (page.jsonLd) {
    html = html.replace(
      /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
      `<script type="application/ld+json">\n${JSON.stringify(page.jsonLd, null, 2)}\n    </script>`,
    )
  }

  const file = path.join(dist, page.file ?? `${page.route.replace(/^\//, '')}.html`)
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, html)
}

const quotePages = pages.filter((page) => page.route.startsWith('/quotes/')).length
console.log(
  `Generated ${pages.length} route pages in dist/ ` +
    `(${pages.length - quotePages} site pages + ${quotePages} quote permalinks)`,
)
