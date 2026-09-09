import { Helmet } from 'react-helmet-async'
import { SITE_URL, SITE_NAME, DEFAULT_TITLE, DEFAULT_DESCRIPTION, LOCALE } from '../config/site'

interface SeoProps {
  /** Page-specific title. Omit to use the site default (home page). */
  title?: string
  /** Page-specific description. Omit to use the site default. */
  description?: string
  /** Route path, e.g. '/privacy'. Used to build the canonical/OG URL. */
  path?: string
  /** Set true for pages that shouldn't be indexed. */
  noIndex?: boolean
}

/**
 * Per-route <head> overrides, layered on top of index.html's static tags.
 *
 * IMPORTANT: this only patches the live DOM — react-helmet-async runs
 * client-side, so it never changes the static dist/index.html that
 * non-JS crawlers and social share bots read. It benefits real browsers
 * (tab title) and JS-rendering crawlers (Googlebot) only. Keep
 * index.html accurate for the home page independently. See CLAUDE.md,
 * section "SEO", before changing how this component is used.
 */
export default function Seo({ title, description, path = '/', noIndex }: SeoProps) {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE
  const pageDescription = description ?? DEFAULT_DESCRIPTION
  const url = `${SITE_URL}${path}`

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <link rel="canonical" href={url} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:locale" content={LOCALE} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
    </Helmet>
  )
}
