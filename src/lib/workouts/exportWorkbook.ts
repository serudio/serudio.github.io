import { formatMonth, formatWeekdayDay } from '../formatDate'
import type { Exercise, WorkoutSet } from './db'
import type { Cell, Sheet } from './xlsx'

/**
 * The whole history as a workbook, one sheet per year, laid out the way
 * these records were kept before this site existed: days down,
 * exercises across, a day total beside each exercise and its month
 * total on the month's first row.
 *
 * It exports everything, never what the grid happens to be showing. A
 * filtered column or a folded month is a way of reading the page; a
 * file that quietly left them out would be a worse copy of the record
 * than the one it was made from, and nothing on it would say so.
 */

interface Column {
  exercise: Exercise
  width: number
}

function columnsFor(sets: WorkoutSet[], exercises: Exercise[]): Column[] {
  const used = new Map<string, number>()
  for (const set of sets) {
    used.set(set.exerciseId, Math.max(used.get(set.exerciseId) ?? 0, set.slot + 1))
  }
  // Only what that year actually contains: an exercise taken up in 2025
  // has no business adding empty columns to 2018.
  return exercises
    .filter((exercise) => (used.get(exercise.id) ?? 0) > 0)
    .map((exercise) => ({ exercise, width: used.get(exercise.id) as number }))
}

function yearSheet(
  year: number,
  sets: WorkoutSet[],
  exercises: Exercise[],
  locale: string,
): Sheet {
  const columns = columnsFor(sets, exercises)

  const byDate = new Map<string, WorkoutSet[]>()
  for (const set of sets) {
    const list = byDate.get(set.doneOn)
    if (list) list.push(set)
    else byDate.set(set.doneOn, [set])
  }

  const dates = [...byDate.keys()].sort()
  const yearTotals = new Map<string, number>()
  const monthTotals = new Map<string, Map<string, number>>()

  for (const set of sets) {
    yearTotals.set(set.exerciseId, (yearTotals.get(set.exerciseId) ?? 0) + set.reps)
    const key = set.doneOn.slice(0, 7)
    const forMonth = monthTotals.get(key) ?? new Map<string, number>()
    forMonth.set(set.exerciseId, (forMonth.get(set.exerciseId) ?? 0) + set.reps)
    monthTotals.set(key, forMonth)
  }

  // Headed exactly as the original workbook heads it: the exercise name
  // over its first set column, the set numbers beneath, and the year
  // total in the second summary column. Naming the two total columns
  // would read better to someone meeting the file cold, and would also
  // make it a different shape from the eight years of sheets this is a
  // copy of — including to the parser that reads those.
  const header1: Cell[] = [year, null]
  const header2: Cell[] = [null, null]
  for (const column of columns) {
    header1.push(column.exercise.name)
    for (let i = 1; i < column.width + 2; i += 1) header1.push(null)

    for (let i = 0; i < column.width; i += 1) header2.push(i + 1)
    header2.push(null, yearTotals.get(column.exercise.id) ?? 0)
  }

  const rows: Cell[][] = [header1, header2]
  let lastMonth = ''

  for (const date of dates) {
    const month = date.slice(0, 7)
    const startsMonth = month !== lastMonth
    lastMonth = month

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
      const dayTotal = mine.reduce((sum, set) => sum + set.reps, 0)
      row.push(dayTotal > 0 ? dayTotal : null)
      row.push(
        startsMonth ? monthTotals.get(month)?.get(column.exercise.id) ?? 0 : null,
      )
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
