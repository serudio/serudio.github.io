/**
 * Dates as dd-MMM-yy, e.g. 05-Nov-26.
 *
 * Built by hand rather than through toLocaleDateString's own short
 * format, which differs per locale (05.11.26, 11/5/26) — the shape is
 * meant to be the same wherever it is read. Only the month name follows
 * the language, since that is the part that has to be read rather than
 * counted.
 *
 * Lives here rather than under travel/ because goals date the same way,
 * and the local-midnight correction below is the kind of thing that
 * should be got right once.
 */
export function formatDay(date: Date, locale: string): string {
  const day = String(date.getDate()).padStart(2, '0')
  // Ukrainian short months carry a trailing point ("лист."), which
  // reads badly between hyphens.
  const month = date.toLocaleDateString(locale, { month: 'short' }).replace(/\.$/, '')
  const year = String(date.getFullYear() % 100).padStart(2, '0')

  return `${day}-${month}-${year}`
}

/**
 * A DATE column's value, which arrives as "2026-11-05" with no time.
 * `new Date` reads that as UTC midnight, which renders as the day
 * before anywhere west of Greenwich — hence the explicit local time.
 */
export function formatDateOnly(value: string, locale: string): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return formatDay(date, locale)
}

/**
 * A timestamp as dd-MMM-yy.
 *
 * created_at carries a time, unlike the DATE columns above, so it is
 * already unambiguous about which day it means — no local-midnight
 * correction needed.
 */
export function formatTimestamp(value: string, locale: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return formatDay(date, locale)
}

/**
 * Today as the database writes a DATE: "2026-11-05", in the reader's own
 * timezone. Built from the local parts rather than toISOString(), which
 * converts to UTC first and hands back yesterday for most of the evening
 * in Kyiv.
 */
export function todayIso(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/** A DATE value shifted by whole days, still as "YYYY-MM-DD". */
export function addDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00`)
  date.setDate(date.getDate() + days)
  return todayIso(date)
}

/**
 * A grid row's day label: weekday and day of the month, "чт-13".
 *
 * The shape the records were already kept in — the weekday is the part
 * that makes a training pattern visible at a glance, which a bare
 * number does not.
 */
export function formatWeekdayDay(value: string, locale: string): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  const weekday = date.toLocaleDateString(locale, { weekday: 'short' }).replace(/\.$/, '')
  return `${weekday}-${String(date.getDate()).padStart(2, '0')}`
}

/** A month's name in the reader's language, e.g. "листопад". */
export function formatMonth(year: number, month: number, locale: string): string {
  return new Date(year, month - 1, 1).toLocaleDateString(locale, { month: 'long' })
}

/** How many days a month has, 1-indexed month. */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/** "2026-11-13" from its parts. */
export function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
