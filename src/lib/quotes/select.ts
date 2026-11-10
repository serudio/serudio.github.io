import { RESTRICTED_SLUGS } from '../../data/quoteCategories'
import type { Quote } from '../../data/quotes'

/**
 * Picking what the visitor sees. Pure functions, kept apart from the
 * page so the filtering and the no-repeat rule can be reasoned about on
 * their own.
 */

/**
 * Whether a quote may be shown for the selected categories.
 *
 * Two rules, in order:
 *  1. A quote carrying a restricted category (demotivational) is hidden
 *     unless that exact category is selected. This is strict on purpose:
 *     a quote tagged both `love` and `demotivational` stays hidden when
 *     only `love` is picked. To relax it, drop this check to
 *     `selected.some(...)` over the quote's own categories instead.
 *  2. With no selection, everything unrestricted is in play.
 */
export function isVisible(quote: Quote, selected: string[]): boolean {
  const restricted = quote.categories.filter((slug) => RESTRICTED_SLUGS.includes(slug))

  if (restricted.length > 0 && !restricted.every((slug) => selected.includes(slug))) {
    return false
  }

  if (selected.length === 0) return true

  return quote.categories.some((slug) => selected.includes(slug))
}

export function filterQuotes(quotes: Quote[], selected: string[]): Quote[] {
  return quotes.filter((quote) => isVisible(quote, selected))
}

/**
 * Picks a random quote, avoiding the one already on screen so a refresh
 * visibly changes something. With a single candidate there is nothing to
 * avoid, so it comes back unchanged rather than returning nothing.
 */
export function pickRandom(quotes: Quote[], avoidId?: string): Quote | null {
  if (quotes.length === 0) return null
  if (quotes.length === 1) return quotes[0]

  const candidates = avoidId ? quotes.filter((quote) => quote.id !== avoidId) : quotes
  const pool = candidates.length > 0 ? candidates : quotes

  return pool[Math.floor(Math.random() * pool.length)]
}

/** Category slugs as they travel in the URL: /quotes?c=humor,love */
export function parseCategoryParam(value: string | null, known: string[]): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((slug) => slug.trim())
    .filter((slug) => known.includes(slug))
}

export function formatCategoryParam(selected: string[]): string {
  return selected.join(',')
}
