import type { Book } from "./books";

export const currency = "грн";

/** Base rates. Individual books can cost more — each card shows its own price. */
export const rentalTerms = {
  perWeek: 50,
  perTwoWeeks: 75,
  perExtraDay: 10,
  pledge: 300,
  // note: "The pledge is taken at handover and returned in full once the book comes back undamaged. Rent for longer than two weeks is charged per extra day.",
};

/**
 * A book with no rate of its own is rented on the standard terms above, so the
 * admin only has to fill these in for the exceptions.
 */
export function priceFor(book: Pick<Book, "pricePerWeek">) {
  return book.pricePerWeek || rentalTerms.perWeek;
}

export function pledgeFor(book: Pick<Book, "pledge">) {
  return book.pledge || rentalTerms.pledge;
}
