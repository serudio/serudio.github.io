import type { TravelCategory, TravelItem, TravelNote } from './db'

/**
 * The packing list as plain text, ready to paste into a chat with an
 * assistant and be asked what is missing.
 *
 * Markdown-ish checkboxes rather than a table or JSON: it stays readable
 * to the person who copied it, survives being pasted anywhere, and is
 * the shape models already read well. The whole list goes in, packed
 * items included — what is already done is exactly the context that
 * stops an assistant suggesting it again.
 *
 * The lead line is part of the copied text, not just the tooltip, so a
 * paste on its own already asks the question.
 */
export function exportList(options: {
  trip: { name: string; startsOn: string | null; endsOn: string | null }
  categories: TravelCategory[]
  items: TravelItem[]
  notes: TravelNote[]
  strings: {
    lead: string
    trip: string
    dates: string
    beforeLeaving: string
    uncategorised: string
  }
}): string {
  const { trip, categories, items, notes, strings } = options
  const lines: string[] = [strings.lead, '', `${strings.trip}: ${trip.name}`]

  const dates = [trip.startsOn, trip.endsOn].filter(Boolean).join(' — ')
  if (dates) lines.push(`${strings.dates}: ${dates}`)

  const tick = (done: boolean) => (done ? '[x]' : '[ ]')

  const section = (heading: string, rows: { text: string; done: boolean }[]) => {
    if (rows.length === 0) return
    lines.push('', `## ${heading}`)
    for (const row of rows) lines.push(`- ${tick(row.done)} ${row.text}`)
  }

  for (const category of categories) {
    section(
      category.name,
      items
        .filter((item) => item.categoryId === category.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => ({ text: item.text, done: item.packed })),
    )
  }

  section(
    strings.uncategorised,
    items
      .filter((item) => item.categoryId === null)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({ text: item.text, done: item.packed })),
  )

  section(
    strings.beforeLeaving,
    notes
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((note) => ({ text: note.text, done: note.done })),
  )

  return lines.join('\n')
}

/**
 * The same list as CSV, for a spreadsheet.
 *
 * Deliberately not the format offered for an assistant: a table drops
 * the lead line that makes the paste a question, and reads worse than
 * the checklist above. This is for sorting and filtering elsewhere.
 */
export function exportCsv(options: {
  categories: TravelCategory[]
  items: TravelItem[]
  headers: { section: string; item: string; packed: string }
  uncategorised: string
}): string {
  const { categories, items, headers, uncategorised } = options
  const names = new Map(categories.map((category) => [category.id, category.name]))

  // Quote everything: section names are the user's own words and may
  // hold a comma, a quote or a newline.
  const cell = (value: string) => `"${value.replace(/"/g, '""')}"`

  const rows = [[headers.section, headers.item, headers.packed].map(cell).join(',')]
  for (const item of items.slice().sort((a, b) => a.sortOrder - b.sortOrder)) {
    rows.push(
      [
        cell(item.categoryId ? (names.get(item.categoryId) ?? uncategorised) : uncategorised),
        cell(item.text),
        cell(item.packed ? '1' : '0'),
      ].join(','),
    )
  }

  // A BOM, or Excel reads the Cyrillic as mojibake.
  return `\uFEFF${rows.join('\r\n')}\r\n`
}
