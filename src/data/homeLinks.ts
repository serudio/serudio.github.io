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
export type HomeLinkGroup = 'projects' | 'converters' | 'travel' | 'goals' | 'quotes'

export interface HomeLink {
  id: string
  /** i18n key for the chip's label. */
  labelKey: string
  group: HomeLinkGroup
  /** Internal route, handled by the router. */
  to?: string
  /** External URL, opened in a new tab. */
  href?: string
  /**
   * In the navigation menu but not on the home page.
   *
   * The home page is the front door and reads best when each group
   * answers one question; the menu is the full index and can afford the
   * rest.
   */
  navOnly?: boolean
}

export const HOME_LINK_GROUPS: HomeLinkGroup[] = [
  'projects',
  'converters',
  'travel',
  'goals',
  'quotes',
]

/** i18n key for each group's heading. */
export const GROUP_HEADING_KEYS: Record<HomeLinkGroup, string> = {
  projects: 'projects.heading',
  converters: 'converters.heading',
  travel: 'travel.title',
  goals: 'goals.title',
  // Named for what the section is for, not what it contains; the
  // /quotes page itself is still titled "Quotes".
  quotes: 'quotes.homeHeading',
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
  // No "view all" entry: every converter is listed here already, and the
  // index itself is in the header nav.
  ...converters.map((converter) => ({
    id: `converters.${converter.slug}`,
    labelKey: converter.nameKey,
    group: 'converters' as const,
    to: `/converters/${converter.slug}`,
  })),
]

const travelLinks: HomeLink[] = [
  // The packing list needs an account; RequireAuth sorts that out.
  { id: 'travel.index', labelKey: 'travel.myTrips', group: 'travel', to: '/travel' },
  {
    // Kept out of the home page: it is where you go from a trip, not
    // somewhere to start. /travel offers it, and so does a trip's own
    // bar.
    id: 'travel.recommended',
    labelKey: 'travel.recommendedTitle',
    group: 'travel',
    to: '/travel/recommended',
    navOnly: true,
  },
]

const goalLinks: HomeLink[] = [
  // Needs an account, like the packing list; RequireAuth sorts that out.
  { id: 'goals.index', labelKey: 'goals.myGoals', group: 'goals', to: '/goals' },
]

const quoteLinks: HomeLink[] = [
  // Labelled apart from the group heading, which is already "Quotes".
  { id: 'quotes.index', labelKey: 'quotes.randomLink', group: 'quotes', to: '/quotes' },
]

/** Everything, for the navigation menu. */
export const homeLinks: HomeLink[] = [
  ...projectLinks,
  ...converterLinks,
  ...travelLinks,
  ...goalLinks,
  ...quoteLinks,
]

/** What the home page shows: everything the menu has, less the detours. */
export const homePageLinks: HomeLink[] = homeLinks.filter((link) => !link.navOnly)

export function findHomeLink(id: string): HomeLink | undefined {
  return homeLinks.find((link) => link.id === id)
}
