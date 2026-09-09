import { lazy, type ComponentType } from 'react'

export interface ConverterPageProps {
  slug: string
  /** i18n key for the page's <h1>/SEO title. */
  titleKey: string
  /** i18n key for the page's meta description. */
  seoDescriptionKey: string
}

export interface ConverterMeta extends ConverterPageProps {
  /** i18n key for the short human name — used in nav/index cards. */
  nameKey: string
  /** i18n key for the one-line description shown on the converters index. */
  descriptionKey: string
  /** The page component for this converter's route, lazy-loaded per route. */
  Page: ComponentType<ConverterPageProps>
}

/**
 * Registry of all converters. This is the single place to add a new one —
 * it drives the /converters index list, the route for /converters/<slug>
 * in src/App.tsx, AND the sitemap/robots generation in
 * scripts/generate-seo-files.ts (which imports this file directly), so a
 * new entry here is automatically discoverable and indexable without
 * touching anything else.
 *
 * All text is referenced by i18n key (see src/i18n/locales/*.json,
 * "converters" section), not literal strings, so every converter is
 * bilingual by construction — add the matching keys in both locale files
 * for a new converter.
 *
 * Each Page component receives its own metadata as props (see
 * ConverterPageProps) from App.tsx's route — it should NOT import this
 * file itself, to avoid a circular import between the registry and the
 * pages it lazy-loads.
 *
 * See CLAUDE.md, sections "SEO" and "Internationalization", for the
 * checklist a new converter page still needs to satisfy.
 */
export const converters: ConverterMeta[] = [
  {
    slug: 'fuel-consumption',
    nameKey: 'converters.fuelConsumption.name',
    descriptionKey: 'converters.fuelConsumption.shortDescription',
    titleKey: 'converters.fuelConsumption.title',
    seoDescriptionKey: 'converters.fuelConsumption.seoDescription',
    Page: lazy(() => import('../pages/converters/FuelConverterPage')),
  },
]
