/**
 * URL slugs for quote permalinks.
 *
 * A quote's page lives at /quotes/<slug>, and those links get shared, so
 * the slug is built from the Ukrainian text rather than an opaque id —
 * a readable link survives being pasted into a chat. Ukrainian is
 * transliterated to Latin because a percent-encoded Cyrillic URL is
 * unreadable in exactly the place the link is most often seen.
 */

// Ukrainian National transliteration, close enough for URLs. Order
// matters: the digraphs have to be replaced before their first letter.
const DIGRAPHS: [RegExp, string][] = [
  [/зг/g, 'zgh'],
  [/ж/g, 'zh'],
  [/х/g, 'kh'],
  [/ц/g, 'ts'],
  [/ч/g, 'ch'],
  [/ш/g, 'sh'],
  [/щ/g, 'shch'],
  [/ю/g, 'iu'],
  [/я/g, 'ia'],
  [/є/g, 'ie'],
  [/ї/g, 'i'],
  [/й/g, 'i'],
]

const LETTERS: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', з: 'z',
  и: 'y', і: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p',
  р: 'r', с: 's', т: 't', у: 'u', ф: 'f', ь: '', "'": '', '’': '',
}

/** How much of the quote goes into the slug before it gets unwieldy. */
const MAX_LENGTH = 60

export function transliterate(text: string): string {
  let result = text.toLowerCase()
  for (const [pattern, replacement] of DIGRAPHS) result = result.replace(pattern, replacement)
  return result.replace(/[\s\S]/g, (char) => LETTERS[char] ?? char)
}

/**
 * Builds a slug from a quote's Ukrainian text. Truncates on a word
 * boundary so the tail isn't a cut-off word.
 */
export function slugifyQuote(text: string): string {
  const base = transliterate(text)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (base.length <= MAX_LENGTH) return base

  const cut = base.slice(0, MAX_LENGTH)
  const lastDash = cut.lastIndexOf('-')
  return (lastDash > 20 ? cut.slice(0, lastDash) : cut).replace(/-+$/, '')
}
