import { converters } from './converters'
import { projects } from './projects'

/**
 * Everything the home page links to, in one place.
 *
 * The home page is a chip grid rather than a stack of cards because the
 * list is expected to keep growing — adding a destination should mean
 * one entry here, not another section on the page.
 *
 * `id` is also the key the usage counter stores (see src/lib/usage.ts),
 * so it must stay stable: changing one resets that link's history.
 */
export type HomeLinkGroup = 'projects' | 'converters' | 'quotes'

export interface HomeLink {
  id: string
  /** i18n key for the chip's label. */
  labelKey: string
  group: HomeLinkGroup
  /** Internal route, handled by the router. */
  to?: string
  /** External URL, opened in a new tab. */
  href?: string
}

export const HOME_LINK_GROUPS: HomeLinkGroup[] = ['projects', 'converters', 'quotes']

/** i18n key for each group's heading. */
export const GROUP_HEADING_KEYS: Record<HomeLinkGroup, string> = {
  projects: 'projects.heading',
  converters: 'converters.heading',
  quotes: 'quotes.title',
}

const projectLinks: HomeLink[] = projects.map((project) => ({
  // projects.ts has no id of its own; its title key is already unique
  // and stable, which is what the usage counter needs.
  id: project.titleKey,
  labelKey: project.titleKey,
  group: 'projects',
  ...(project.internal
    ? { to: new URL(project.url).pathname }
    : { href: project.url }),
}))

const converterLinks: HomeLink[] = [
  {
    id: 'converters.index',
    labelKey: 'converters.viewAll',
    group: 'converters',
    to: '/converters',
  },
  ...converters.map((converter) => ({
    id: `converters.${converter.slug}`,
    labelKey: converter.nameKey,
    group: 'converters' as const,
    to: `/converters/${converter.slug}`,
  })),
]

const quoteLinks: HomeLink[] = [
  // Labelled apart from the group heading, which is already "Quotes".
  { id: 'quotes.index', labelKey: 'quotes.randomLink', group: 'quotes', to: '/quotes' },
]

export const homeLinks: HomeLink[] = [...projectLinks, ...converterLinks, ...quoteLinks]

export function findHomeLink(id: string): HomeLink | undefined {
  return homeLinks.find((link) => link.id === id)
}
