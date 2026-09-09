import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { SITE_URL } from '../src/config/site'
import { converters } from '../src/data/converters'

// Run via `tsx` (see package.json prebuild/predev) so it can import the
// same TypeScript modules the app uses — one source of truth, no
// hand-maintained duplicate list of routes.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

// Static routes that should be discoverable by search engines. Converter
// routes are pulled from the registry (src/data/converters.ts) that also
// drives the app's routing and the /converters index — add a converter
// there and it shows up here automatically.
const staticRoutes = ['/', '/converters', '/privacy']
const converterRoutes = converters.map((c) => `/converters/${c.slug}`)
const routes = [...staticRoutes, ...converterRoutes]

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`

const today = new Date().toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${SITE_URL}${route}</loc>
    <lastmod>${today}</lastmod>
  </url>`,
  )
  .join('\n')}
</urlset>
`

writeFileSync(path.join(root, 'public', 'robots.txt'), robots)
writeFileSync(path.join(root, 'public', 'sitemap.xml'), sitemap)

console.log(`Generated public/robots.txt and public/sitemap.xml (${routes.length} routes) for ${SITE_URL}`)
