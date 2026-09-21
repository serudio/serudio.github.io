import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { SITE_URL } from "../src/config/site";
import { converters } from "../src/data/converters";

// Run via `tsx` (see package.json prebuild/predev) so it can import the
// same TypeScript modules the app uses — one source of truth, no
// hand-maintained duplicate list of routes.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Static routes that should be discoverable by search engines. Converter
// routes are pulled from the registry (src/data/converters.ts) that also
// drives the app's routing and the /converters index — add a converter
// there and it shows up here automatically.
const staticRoutes = ["/", "/converters", "/privacy"];

// The other projects (see src/data/projects.ts) are separate repos, but
// GitHub Pages serves them under this same origin, so this sitemap is
// allowed to list them — and it's the only sitemap that does, since
// neither project ships one of its own.
//
// Trailing slashes are deliberate: GitHub Pages 301-redirects
// /todo-cloud to /todo-cloud/, and a sitemap should name the URL that
// actually answers rather than one that redirects.
//
// See CLAUDE.md, section "SEO".
const projectRoutes = [
  "/todo-cloud/",
  "/books/",
  // NOT listed: /todo-cloud/lists and /todo-cloud/points. Those paths
  // return 404 — todo-cloud routes by hash (#/lists) and, like this site
  // did before scripts/generate-route-pages.ts, has no file behind a
  // plain path. A sitemap that lists 404s gets those URLs rejected and
  // loses credibility for every other URL in it. They can come back once
  // the todo-cloud repo serves real paths AND shows those screens
  // something other than a sign-in wall, since there's nothing for a
  // crawler to index behind the login either.
];

const converterRoutes = converters.map((c) => `/converters/${c.slug}`);
const routes = [...staticRoutes, ...projectRoutes, ...converterRoutes];

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${SITE_URL}${route}</loc>
    <lastmod>${today}</lastmod>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

writeFileSync(path.join(root, "public", "robots.txt"), robots);
writeFileSync(path.join(root, "public", "sitemap.xml"), sitemap);

console.log(
  `Generated public/robots.txt and public/sitemap.xml (${routes.length} routes) for ${SITE_URL}`,
);
