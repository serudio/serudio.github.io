/**
 * A trip date as dd-MMM-yy, e.g. 05-Nov-26.
 *
 * Built by hand rather than through toLocaleDateString's own short
 * format, which differs per locale (05.11.26, 11/5/26) — the shape is
 * meant to be the same wherever it is read. Only the month name follows
 * the language, since that is the part that has to be read rather than
 * counted.
 *
 * The column is a DATE, so the value arrives as "2026-11-05" with no
 * time. `new Date` reads that as UTC midnight, which renders as the day
 * before anywhere west of Greenwich — hence the explicit local time.
 */
export function formatDay(date: Date, locale: string): string {
  const day = String(date.getDate()).padStart(2, '0')
  // Ukrainian short months carry a trailing point ("лист."), which
  // reads badly between hyphens.
  const month = date.toLocaleDateString(locale, { month: 'short' }).replace(/\.$/, '')
  const year = String(date.getFullYear() % 100).padStart(2, '0')

  return `${day}-${month}-${year}`
}

export function formatTripDate(value: string, locale: string): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return formatDay(date, locale)
}

/**
 * The name a trip gets when it is started without one.
 *
 * The same shape as the dates shown on it — a trip called 10.11.2026
 * sitting above "10-Nov-26" looked like two different days.
 */
export function defaultTripName(locale: string): string {
  return formatDay(new Date(), locale)
}

/** Both ends of a trip, or whichever one it has. */
export function formatTripDates(
  trip: { startsOn: string | null; endsOn: string | null },
  locale: string,
): string {
  return [trip.startsOn, trip.endsOn]
    .filter((value): value is string => Boolean(value))
    .map((value) => formatTripDate(value, locale))
    .join(' — ')
}
