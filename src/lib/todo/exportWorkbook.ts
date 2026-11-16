import type { TodoItem } from './db'
import type { Cell, Sheet } from '../xlsx'

/**
 * The list as a one-sheet workbook, for keeping somewhere else.
 *
 * In wall order, which is the only order the list has: the items are
 * not ranked, and sorting them by size on the way out would describe a
 * list that is not the one on screen.
 *
 * The count is a formula rather than the number this app worked out, on
 * the same principle as the workouts export: the file stays a
 * spreadsheet, so a row deleted in Drive is a count that follows. A
 * frozen number would keep insisting on a total the rows no longer add
 * up to.
 */
export function buildTodoExport(
  items: TodoItem[],
  labels: {
    title: string
    count: string
    item: string
    size: string
    color: string
    done: string
  },
  /**
   * A colour index to its name, resolved by the page: the palette is
   * presentation and does not belong down here.
   */
  colorName: (index: number) => string,
): Sheet[] {
  // Data starts on row 4: title, blank, headers.
  const FIRST = 4
  const last = FIRST + items.length - 1

  const rows: Cell[][] = [
    [
      labels.title,
      labels.count,
      items.length > 0
        ? { f: `COUNTA(A${FIRST}:A${last})`, v: items.length }
        : 0,
    ],
    [],
    [labels.item, labels.size, labels.color, labels.done],
    ...items.map((item): Cell[] => [
      item.text,
      item.weight,
      colorName(item.color),
      // The day, not the instant. A spreadsheet column of full
      // timestamps is unreadable, and nothing here was timed to the
      // second anyway.
      item.doneAt ? item.doneAt.slice(0, 10) : null,
    ]),
  ]

  return [{ name: labels.title, rows }]
}
