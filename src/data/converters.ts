import { lazy, type ComponentType } from 'react'

export interface ConverterPageProps {
  slug: string
  title: string
  seoDescription: string
}

export interface ConverterMeta extends ConverterPageProps {
  /** Short human name, e.g. "Витрата пального" — used in nav/index cards. */
  name: string
  /** One-line description shown on the converters index page. */
  description: string
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
 * Each Page component receives its own metadata as props (see
 * ConverterPageProps) from App.tsx's route — it should NOT import this
 * file itself, to avoid a circular import between the registry and the
 * pages it lazy-loads.
 *
 * See CLAUDE.md, section "SEO", for the checklist a new converter page
 * still needs to satisfy (unique title/description, one <h1>, etc.).
 */
export const converters: ConverterMeta[] = [
  {
    slug: 'fuel-consumption',
    name: 'Витрата пального',
    title: 'Конвертер витрати пального (MPG → L/100 км)',
    description: 'US MPG → L/100 км',
    seoDescription:
      'Онлайн конвертер витрати пального: переведіть US MPG у літри на 100 км (L/100 km) миттєво, з таблицею популярних значень.',
    Page: lazy(() => import('../pages/converters/FuelConverterPage')),
  },
]
