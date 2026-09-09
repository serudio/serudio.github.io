import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { SITE_URL, SITE_NAME } from '../config/site'

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

const OG_LOCALE_BY_LANGUAGE: Record<string, string> = {
  uk: 'uk_UA',
  en: 'en_US',
}

/**
 * Per-route <head> overrides, layered on top of index.html's static tags.
 *
 * IMPORTANT: this only patches the live DOM — react-helmet-async runs
 * client-side, so it never changes the static dist/index.html that
 * non-JS crawlers and social share bots read (and that file is always
 * Ukrainian — see CLAUDE.md "Internationalization"). This benefits real
 * browsers (tab title) and JS-rendering crawlers (Googlebot) only.
 */
export default function Seo({ title, description, path = '/', noIndex }: SeoProps) {
  const { t, i18n } = useTranslation()
  const pageTitle = title ? `${title} | ${SITE_NAME}` : t('seo.defaultTitle')
  const pageDescription = description ?? t('seo.defaultDescription')
  const url = `${SITE_URL}${path}`
  const ogLocale = OG_LOCALE_BY_LANGUAGE[i18n.language] ?? OG_LOCALE_BY_LANGUAGE.en

  return (
    <Helmet>
      <html lang={i18n.language} />
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <link rel="canonical" href={url} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:locale" content={ogLocale} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />
    </Helmet>
  )
}
