import { formatMonth, formatWeekdayDay } from '../formatDate'
import type { Exercise, WorkoutSet } from './db'
import { columnName, type Cell, type Sheet } from './xlsx'

/**
 * The whole history as a workbook, one sheet per year, laid out the way
 * these records were kept before this site existed: days down,
 * exercises across, a day total beside each exercise and its month
 * total on the month's first row.
 *
 * EVERY TOTAL IS A FORMULA, not the number this app worked out. The
 * point of the file is that it stays a spreadsheet: change a set in
 * Drive and the day, month and year it belongs to follow. Exporting
 * frozen numbers would produce something that looked identical and went
 * wrong the first time it was edited — the totals would keep insisting
 * on figures that no longer matched the cells above them.
 *
 * Each formula still carries the value it currently works out to, so
 * the file reads correctly before anything recalculates.
 *
 * It exports everything, never what the grid happens to be showing. A
 * filtered column or a folded month is a way of reading the page; a
 * file that quietly left them out would be a worse copy of the record
 * than the one it was made from, and nothing on it would say so.
 */

interface Column {
  exercise: Exercise
  width: number
  /** Zero-based index of this exercise's first set column. */
  start: number
  /** Where its day total sits, and its month total after that. */
  dayCol: number
  monthCol: number
}

function layout(sets: WorkoutSet[], exercises: Exercise[]): Column[] {
  const used = new Map<string, number>()
  for (const set of sets) {
    used.set(set.exerciseId, Math.max(used.get(set.exerciseId) ?? 0, set.slot + 1))
  }

  // Only what that year actually contains: an exercise taken up in 2025
  // has no business adding empty columns to 2018.
  let at = 2
  return exercises
    .filter((exercise) => (used.get(exercise.id) ?? 0) > 0)
    .map((exercise) => {
      const width = used.get(exercise.id) as number
      const column = { exercise, width, start: at, dayCol: at + width, monthCol: at + width + 1 }
      at += width + 2
      return column
    })
}

const ref = (column: number, row: number) => `${columnName(column)}${row}`

function yearSheet(
  year: number,
  sets: WorkoutSet[],
  exercises: Exercise[],
  locale: string,
): Sheet {
  const columns = layout(sets, exercises)

  const byDate = new Map<string, WorkoutSet[]>()
  for (const set of sets) {
    const list = byDate.get(set.doneOn)
    if (list) list.push(set)
    else byDate.set(set.doneOn, [set])
  }

  const dates = [...byDate.keys()].sort()
  // Data starts on row 3, under the two header rows.
  const rowOf = new Map(dates.map((date, index) => [date, index + 3]))
  const lastRow = dates.length + 2

  // Which rows each month spans, so a month total can name its range.
  const months = new Map<string, { first: number; last: number }>()
  for (const date of dates) {
    const key = date.slice(0, 7)
    const row = rowOf.get(date) as number
    const span = months.get(key)
    if (span) span.last = row
    else months.set(key, { first: row, last: row })
  }

  const header1: Cell[] = [year, null]
  const header2: Cell[] = [null, null]
  for (const column of columns) {
    // Headed exactly as the original workbook heads it: the name over
    // the first set column, the set numbers beneath, the year total in
    // the second summary column, and nothing over the totals.
    header1.push(column.exercise.name)
    for (let i = 1; i < column.width + 2; i += 1) header1.push(null)

    for (let i = 0; i < column.width; i += 1) header2.push(i + 1)

    const total = sets
      .filter((set) => set.exerciseId === column.exercise.id)
      .reduce((sum, set) => sum + set.reps, 0)
    header2.push(null, {
      // The year is the sum of its day totals, not of every set cell:
      // one column instead of five, and it keeps meaning the same thing
      // if a set column is ever added.
      f: `SUM(${ref(column.dayCol, 3)}:${ref(column.dayCol, lastRow)})`,
      v: total,
    })
  }

  const rows: Cell[][] = [header1, header2]
  let lastMonth = ''

  for (const date of dates) {
    const month = date.slice(0, 7)
    const startsMonth = month !== lastMonth
    lastMonth = month
    const r = rowOf.get(date) as number

    const row: Cell[] = [
      startsMonth ? formatMonth(year, Number(date.slice(5, 7)), locale) : null,
      formatWeekdayDay(date, locale),
    ]

    const onDay = byDate.get(date) ?? []
    for (const column of columns) {
      const mine = onDay.filter((set) => set.exerciseId === column.exercise.id)
      for (let slot = 0; slot < column.width; slot += 1) {
        const set = mine.find((candidate) => candidate.slot === slot)
        row.push(set ? set.reps : null)
      }

      row.push({
        f: `SUM(${ref(column.start, r)}:${ref(column.start + column.width - 1, r)})`,
        v: mine.reduce((sum, set) => sum + set.reps, 0),
      })

      if (startsMonth) {
        const span = months.get(month) as { first: number; last: number }
        const total = sets
          .filter(
            (set) =>
              set.exerciseId === column.exercise.id && set.doneOn.startsWith(month),
          )
          .reduce((sum, set) => sum + set.reps, 0)
        row.push({
          f: `SUM(${ref(column.dayCol, span.first)}:${ref(column.dayCol, span.last)})`,
          v: total,
        })
      } else {
        row.push(null)
      }
    }

    rows.push(row)
  }

  return { name: String(year), rows }
}

export function buildExport(
  sets: WorkoutSet[],
  exercises: Exercise[],
  locale: string,
): Sheet[] {
  const years = [...new Set(sets.map((set) => Number(set.doneOn.slice(0, 4))))]
  // Newest first, as the workbook these came from has it.
  years.sort((a, b) => b - a)

  return years.map((year) =>
    yearSheet(
      year,
      sets.filter((set) => set.doneOn.startsWith(String(year))),
      exercises,
      locale,
    ),
  )
}
