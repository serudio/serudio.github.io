/**
 * Fixes text typed with the wrong keyboard layout selected — e.g. typing
 * "привіт" while the OS keyboard was still set to English produces
 * "ghbdsn" (same physical keys, wrong alphabet). This maps each
 * character back to the letter the *other* layout's key would have
 * produced, based on physical key position — it does not translate.
 *
 * The mapping below is the standard Windows "Ukrainian" keyboard layout
 * (ЙЦУКЕН-based) against US QWERTY. Only letters are remapped; digits,
 * spaces, and punctuation are passed through unchanged — layouts vary
 * more on punctuation, and the primary use case (fixing a mistyped word)
 * doesn't need it.
 */

// Physical key -> lowercase EN letter -> lowercase UA letter.
const EN_TO_UA_LOWER: Record<string, string> = {
  q: 'й', w: 'ц', e: 'у', r: 'к', t: 'е', y: 'н', u: 'г', i: 'ш', o: 'щ', p: 'з', '[': 'х', ']': 'ї',
  a: 'ф', s: 'і', d: 'в', f: 'а', g: 'п', h: 'р', j: 'о', k: 'л', l: 'д', ';': 'ж', "'": 'є',
  z: 'я', x: 'ч', c: 'с', v: 'м', b: 'и', n: 'т', m: 'ь', ',': 'б', '.': 'ю',
}

const UA_TO_EN_LOWER: Record<string, string> = Object.fromEntries(
  Object.entries(EN_TO_UA_LOWER).map(([en, ua]) => [ua, en]),
)

export type LayoutDirection = 'en-to-ua' | 'ua-to-en'

function convertChar(char: string, map: Record<string, string>): string {
  const lower = char.toLowerCase()
  const mapped = map[lower]
  if (!mapped) return char
  return char === lower ? mapped : mapped.toUpperCase()
}

export function convertLayout(text: string, direction: LayoutDirection): string {
  const map = direction === 'en-to-ua' ? EN_TO_UA_LOWER : UA_TO_EN_LOWER
  return [...text].map((char) => convertChar(char, map)).join('')
}

/**
 * Guesses which conversion the input actually needs by counting Latin vs
 * Ukrainian-Cyrillic letters: mostly-Latin text was probably meant to be
 * Ukrainian (typed on an English layout), and vice versa. Returns null
 * when there isn't enough signal (no letters, or a tie) — callers should
 * treat that as "leave as-is" rather than guessing.
 */
export function detectDirection(text: string): LayoutDirection | null {
  let latin = 0
  let cyrillic = 0
  for (const char of text.toLowerCase()) {
    if (EN_TO_UA_LOWER[char]) latin++
    else if (UA_TO_EN_LOWER[char]) cyrillic++
  }
  if (latin === 0 && cyrillic === 0) return null
  if (latin === cyrillic) return null
  return latin > cyrillic ? 'en-to-ua' : 'ua-to-en'
}
