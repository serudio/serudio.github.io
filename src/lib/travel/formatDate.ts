import { formatDateOnly, formatDay } from '../formatDate'

/**
 * Trip-specific date formatting. The general dd-MMM-yy helpers moved to
 * src/lib/formatDate.ts once goals needed them too; what is left here is
 * the part that knows what a trip is.
 */
export { formatDay, formatTimestamp } from '../formatDate'

/** A trip's DATE column — starts_on, ends_on. */
export const formatTripDate = formatDateOnly

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
