/**
 * The categories a quote can carry.
 *
 * These live in code rather than the database, exactly like
 * src/data/converters.ts: the set is small and stable, and keeping it
 * here means the bilingual names come from the locale files for free
 * (see "quotes.categories.<slug>" in src/i18n/locales/*.json) instead of
 * needing a translated name column and its own admin screen.
 *
 * Adding a category is a code change plus two i18n keys.
 */
export interface QuoteCategory {
  slug: string
  /** i18n key for the display name. */
  nameKey: string
  /**
   * Restricted categories are held back: a quote carrying one is hidden
   * from the public page unless the visitor explicitly selects that
   * category. "Demotivational" is the reason this exists — it is not
   * meant to surface to someone who just opened the page.
   *
   * The rule is deliberately strict: a quote tagged both `love` and
   * `demotivational` stays hidden when only `love` is selected. Relaxing
   * that to "show it if any selected category matches" is a one-line
   * change in src/lib/quotes/select.ts.
   */
  restricted?: boolean
}

export const QUOTE_CATEGORIES: QuoteCategory[] = [
  { slug: 'motivational', nameKey: 'quotes.categories.motivational' },
  { slug: 'wisdom', nameKey: 'quotes.categories.wisdom' },
  { slug: 'stoicism', nameKey: 'quotes.categories.stoicism' },
  { slug: 'love', nameKey: 'quotes.categories.love' },
  { slug: 'humor', nameKey: 'quotes.categories.humor' },
  { slug: 'latin', nameKey: 'quotes.categories.latin' },
  { slug: 'demotivational', nameKey: 'quotes.categories.demotivational', restricted: true },
]

export const CATEGORY_SLUGS = QUOTE_CATEGORIES.map((category) => category.slug)

export const RESTRICTED_SLUGS = QUOTE_CATEGORIES.filter((c) => c.restricted).map((c) => c.slug)

export function isKnownCategory(slug: string): boolean {
  return CATEGORY_SLUGS.includes(slug)
}
