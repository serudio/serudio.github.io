import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import {
  SITE_URL,
  SITE_NAME,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  ADSENSE_CLIENT_ID,
} from './src/config/site'

// Fills __PLACEHOLDER__ tokens in index.html from the constants in
// src/config/site.ts, so the static SEO/OG/AdSense tags there and the
// values used at runtime (e.g. in <Seo />) come from one source. See
// src/config/site.ts for why this isn't an env var.
const htmlReplacements: Record<string, string> = {
  SITE_URL,
  SITE_NAME,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  ADSENSE_CLIENT_ID,
}

function htmlSiteConfigPlugin(): Plugin {
  return {
    name: 'html-site-config',
    transformIndexHtml(html) {
      return html.replace(/__(\w+)__/g, (match, key: string) => htmlReplacements[key] ?? match)
    },
  }
}

// serudio.github.io is a user page served from the domain root,
// so the base path is always '/'.
export default defineConfig({
  base: '/',
  plugins: [react(), htmlSiteConfigPlugin()],
  build: {
    outDir: 'dist',
  },
})
