/**
 * Bank deposit maths: what a fixed-rate deposit grows to over a term,
 * with or without interest capitalization (compounding).
 *
 * Kept as pure functions so the widget
 * (src/components/converters/DepositCalculator.tsx) only deals with
 * parsing, formatting and layout. Everything here is currency-agnostic —
 * the inputs and outputs are plain numbers in whatever currency the
 * deposit is held in.
 */

/** How often earned interest is added to the balance. */
export type Compounding = 'end' | 'monthly' | 'quarterly' | 'annually'

export const COMPOUNDING_OPTIONS: Compounding[] = ['end', 'monthly', 'quarterly', 'annually']

/** Compounding periods per year. 'end' means no capitalization at all. */
const PERIODS_PER_YEAR: Record<Exclude<Compounding, 'end'>, number> = {
  monthly: 12,
  quarterly: 4,
  annually: 1,
}

export type TermUnit = 'months' | 'years'

export interface DepositInput {
  /** Initial deposit. */
  amount: number
  /** Nominal annual interest rate, in percent (e.g. 12.5). */
  annualRatePercent: number
  term: number
  termUnit: TermUnit
  compounding: Compounding
  /**
   * Tax withheld from earned interest, in percent. Deposit interest is
   * taxable in many countries and the rate changes with the law, so it's
   * an input rather than a built-in constant — 0 means "don't model tax".
   */
  taxPercent: number
}

export interface DepositResult {
  /** Interest earned before tax. */
  grossInterest: number
  /** Tax withheld from that interest. */
  tax: number
  /** Interest actually kept, after tax. */
  netInterest: number
  /** Initial amount plus net interest — what's paid out at the end. */
  finalAmount: number
  /**
   * Net interest as a percentage of the initial amount per year — what
   * the deposit really returns once capitalization and tax are counted.
   */
  effectiveAnnualRatePercent: number
}

export function termInYears(term: number, unit: TermUnit): number {
  return unit === 'years' ? term : term / 12
}

/**
 * Runs the calculation. Returns null when the inputs can't describe a
 * real deposit (non-finite, non-positive amount or term, negative rate
 * or a tax rate outside 0–100), so the UI can show a hint instead of a
 * nonsense number.
 */
export function calculateDeposit({
  amount,
  annualRatePercent,
  term,
  termUnit,
  compounding,
  taxPercent,
}: DepositInput): DepositResult | null {
  const values = [amount, annualRatePercent, term, taxPercent]
  if (values.some((value) => !Number.isFinite(value))) return null
  if (amount <= 0 || term <= 0) return null
  if (annualRatePercent < 0 || taxPercent < 0 || taxPercent > 100) return null

  const years = termInYears(term, termUnit)
  const rate = annualRatePercent / 100

  // Without capitalization the interest is simple: it's paid out at the
  // end and never itself earns interest.
  const grossInterest =
    compounding === 'end'
      ? amount * rate * years
      : amount * ((1 + rate / PERIODS_PER_YEAR[compounding]) ** (PERIODS_PER_YEAR[compounding] * years) - 1)

  const tax = grossInterest * (taxPercent / 100)
  const netInterest = grossInterest - tax
  const finalAmount = amount + netInterest

  // Annualize the net return: the constant yearly rate that would grow
  // the initial amount to finalAmount over the same term.
  const effectiveAnnualRatePercent = ((finalAmount / amount) ** (1 / years) - 1) * 100

  return { grossInterest, tax, netInterest, finalAmount, effectiveAnnualRatePercent }
}
