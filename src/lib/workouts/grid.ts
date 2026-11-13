import { daysInMonth, isoDate } from '../formatDate'
import type { Exercise, WorkoutSet } from './db'

/**
 * The spreadsheet: days down, exercises across.
 *
 * The same records the day totals are made of, laid out the way they
 * were already being kept — which is the only reason this file exists
 * separately from the page. It is all arithmetic, so it can be checked
 * on its own.
 */

export interface DayRow {
  /** "2026-11-13". */
  date: string
  /** Per exercise, the sets of that day indexed by the column they sit in. */
  slots: Record<string, (WorkoutSet | undefined)[]>
  /** Per exercise, that day's reps. */
  totals: Record<string, number>
  /** Every exercise together. */
  total: number
}

export interface MonthBlock {
  month: number
  days: DayRow[]
  totals: Record<string, number>
  total: number
}

export interface YearGrid {
  year: number
  months: MonthBlock[]
  totals: Record<string, number>
  total: number
  /** How many set columns each exercise gets this year. */
  width: Record<string, number>
}

/** The usual day, and a ceiling so one odd day cannot stretch the page. */
const MIN_COLUMNS = 4
const MAX_COLUMNS = 12

/**
 * How wide each exercise's block of set columns is: as many as were
 * actually done that year, and never fewer than four.
 *
 * There used to be a spare column past the last one used, so the next
 * set always had somewhere to be typed. With four sets being the usual
 * day that meant a fifth empty column on every exercise — seven of them
 * across the page, carrying nothing, every day of the year. Adding a
 * fifth set goes through the bar at the top instead, and the column it
 * creates then stays for the rest of that year.
 */
export function widthFor(sets: WorkoutSet[], exercises: Exercise[]): Record<string, number> {
  const used: Record<string, number> = {}
  for (const set of sets) {
    used[set.exerciseId] = Math.max(used[set.exerciseId] ?? 0, set.slot + 1)
  }

  const width: Record<string, number> = {}
  for (const exercise of exercises) {
    width[exercise.id] = Math.min(
      Math.max(used[exercise.id] ?? 0, MIN_COLUMNS),
      MAX_COLUMNS,
    )
  }
  return width
}

/**
 * Which days get a row.
 *
 * Every day that has a set, plus every day of the current month — the
 * month in progress is a worksheet and needs its empty rows to type
 * into, while a past month is a record and empty days in it say
 * nothing.
 */
function datesFor(sets: WorkoutSet[], year: number, today: string): string[] {
  const dates = new Set(sets.map((set) => set.doneOn))

  const todayYear = Number(today.slice(0, 4))
  if (todayYear === year) {
    const month = Number(today.slice(5, 7))
    for (let day = 1; day <= daysInMonth(year, month); day += 1) {
      dates.add(isoDate(year, month, day))
    }
  }

  return [...dates].sort()
}

export function buildYearGrid(
  sets: WorkoutSet[],
  exercises: Exercise[],
  year: number,
  today: string,
): YearGrid {
  const width = widthFor(sets, exercises)

  const byDate = new Map<string, WorkoutSet[]>()
  for (const set of sets) {
    const list = byDate.get(set.doneOn)
    if (list) list.push(set)
    else byDate.set(set.doneOn, [set])
  }

  const yearTotals: Record<string, number> = {}
  let yearTotal = 0
  const months: MonthBlock[] = []

  // Ascending, like the records they came from — and the page does not
  // jump anywhere on load. Only the month in progress starts unfolded,
  // so today is near the top without the year having to be turned
  // around or the reader having to be moved.
  for (const date of datesFor(sets, year, today)) {
    const month = Number(date.slice(5, 7))
    let block = months[months.length - 1]
    if (!block || block.month !== month) {
      block = { month, days: [], totals: {}, total: 0 }
      months.push(block)
    }

    const slots: Record<string, (WorkoutSet | undefined)[]> = {}
    const totals: Record<string, number> = {}
    let total = 0

    for (const exercise of exercises) {
      slots[exercise.id] = Array.from({ length: width[exercise.id] })
      totals[exercise.id] = 0
    }

    for (const set of byDate.get(date) ?? []) {
      const row = slots[set.exerciseId]
      // A set beyond the capped width still counts towards every total;
      // it just has no cell to sit in.
      if (row && set.slot < row.length) row[set.slot] = set
      totals[set.exerciseId] = (totals[set.exerciseId] ?? 0) + set.reps
      total += set.reps
    }

    block.days.push({ date, slots, totals, total })
    block.total += total
    yearTotal += total

    for (const exercise of exercises) {
      const reps = totals[exercise.id] ?? 0
      block.totals[exercise.id] = (block.totals[exercise.id] ?? 0) + reps
      yearTotals[exercise.id] = (yearTotals[exercise.id] ?? 0) + reps
    }
  }

  return { year, months, totals: yearTotals, total: yearTotal, width }
}

/** The next free column for an exercise on a day, for appending. */
export function nextSlot(sets: WorkoutSet[], exerciseId: string, day: string): number {
  return sets
    .filter((set) => set.exerciseId === exerciseId && set.doneOn === day)
    .reduce((max, set) => Math.max(max, set.slot + 1), 0)
}

/** A day's reps for one exercise, in column order — what a copy copies. */
export function repsOf(sets: WorkoutSet[], exerciseId: string, day: string): number[] {
  return sets
    .filter((set) => set.exerciseId === exerciseId && set.doneOn === day)
    .sort((a, b) => a.slot - b.slot)
    .map((set) => set.reps)
}
