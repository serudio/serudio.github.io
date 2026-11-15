import type { ThemeMode } from '../../theme'
import { MAX_WEIGHT, MIN_WEIGHT, type TodoItem } from '../../lib/todo/db'

/**
 * The colours an item can be, and the type sizes a weight turns into.
 *
 * Each colour is a PAIR, one value per theme, because a single hex
 * cannot be legible on both #05070b and #ffffff. The stored column is
 * the index into this list — see the comment on todo_items.color in
 * migration 0022. The order is fixed: reordering this array would
 * silently repaint every item already saved.
 */

export interface PaletteEntry {
  /** i18n key under todo.colors.* — screen readers get a name, not "#4f46e5". */
  key: string
  dark: string
  light: string
}

export const PALETTE: PaletteEntry[] = [
  { key: 'indigo', dark: '#818cf8', light: '#4f46e5' },
  { key: 'sky', dark: '#38bdf8', light: '#0284c7' },
  { key: 'teal', dark: '#2dd4bf', light: '#0d9488' },
  { key: 'green', dark: '#4ade80', light: '#16a34a' },
  { key: 'amber', dark: '#fbbf24', light: '#b45309' },
  { key: 'orange', dark: '#fb923c', light: '#c2410c' },
  { key: 'rose', dark: '#fb7185', light: '#e11d48' },
  { key: 'purple', dark: '#c084fc', light: '#9333ea' },
]

export function colorOf(index: number, mode: ThemeMode): string {
  // A row written when the palette was longer, or anything else out of
  // range, falls back to the first colour rather than rendering
  // "undefined" as a CSS value and disappearing.
  const entry = PALETTE[index] ?? PALETTE[0]
  return mode === 'light' ? entry.light : entry.dark
}

/**
 * Weight to type size, in rem.
 *
 * 1 is readable rather than tiny: an item small enough to squint at is
 * one you stop seeing, and the point of making something small here is
 * to push it down the pile, not out of the list.
 */
export function fontSizeOf(weight: number): string {
  const clamped = Math.min(Math.max(weight, MIN_WEIGHT), MAX_WEIGHT)
  return `${(0.85 + (clamped - MIN_WEIGHT) * 0.22).toFixed(2)}rem`
}

/**
 * The colour to give the next item: whichever is used least, and the
 * earliest in the palette among ties.
 *
 * Picking at random would hand out the same hue three times in a row
 * often enough to look broken, and cycling by position would repaint
 * the sequence every time something in the middle was deleted.
 */
export function nextColor(items: TodoItem[]): number {
  const counts = PALETTE.map(() => 0)
  for (const item of items) {
    if (item.color >= 0 && item.color < counts.length) counts[item.color] += 1
  }

  let best = 0
  for (let index = 1; index < counts.length; index += 1) {
    if (counts[index] < counts[best]) best = index
  }
  return best
}
