/**
 * Bank deposit maths: what a fixed-rate deposit grows to over a term,
 * with or without interest capitalization (compounding), and with
 * optional regular top-ups.
 *
 * The period-by-period schedule is the source of truth — the headline
 * totals are summed from it rather than computed by a separate closed
 * form, so the breakdown table can never disagree with the summary
 * above it.
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

/**
 * Without capitalization there's no natural period to break the term
 * into, so the schedule falls back to months — which is also where
 * top-ups land in that case.
 */
const UNCAPITALIZED_PERIODS_PER_YEAR = 12

/**
 * Upper bound on schedule rows, so a stray "9999 years, monthly" can't
 * lock the page up building a table nobody asked for.
 */
const MAX_PERIODS = 1200

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
  /**
   * Regular top-up paid in at the start of every period except the
   * first, so every top-up earns a full period of interest and there's
   * no pointless contribution on the closing day. 0 means "no top-ups".
   */
  topUp: number
}

/** One period of the deposit — a single row of the breakdown table. */
export interface DepositPeriod {
  /** 1-based period number. */
  index: number
  /** Balance this period started with, before the top-up. */
  openingBalance: number
  /** Top-up paid in at the start of this period (0 for the first). */
  topUp: number
  /** Interest accrued over this period, before tax. */
  grossInterest: number
  /** Tax withheld from this period's interest. */
  tax: number
  /** Interest kept — added to the balance when capitalizing. */
  netInterest: number
  /** What the deposit is worth at the end of this period. */
  closingBalance: number
  /**
   * How much of a full period this row covers — 1 for a whole
   * month/quarter/year, less for a final stub period (e.g. a 14-month
   * term with quarterly capitalization ends with 2/3 of a quarter).
   */
  fraction: number
}

export interface DepositResult {
  /** Initial deposit plus every top-up — the money you put in. */
  totalContributed: number
  /** Interest earned over the whole term, before tax. */
  grossInterest: number
  /** Total tax withheld from that interest. */
  tax: number
  /** Interest actually kept, after tax. */
  netInterest: number
  /** What's paid out at the end. */
  finalAmount: number
  /**
   * The annual return the deposit actually delivers on the money you put
   * in, after capitalization and tax. With top-ups this is a money-
   * weighted rate (an IRR), since later contributions earn interest for
   * less time than the initial one.
   */
  effectiveAnnualRatePercent: number
  /** Period-by-period breakdown. */
  schedule: DepositPeriod[]
}

function termInYears(term: number, unit: TermUnit): number {
  return unit === 'years' ? term : term / 12
}

/** Money rounds to cents, the way a bank's own statement does. */
function round2(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Runs the calculation. Returns null when the inputs can't describe a
 * real deposit (non-finite, non-positive amount or term, negative rate
 * or top-up, a tax rate outside 0–100, or a term so long the schedule
 * would exceed MAX_PERIODS), so the UI can show a hint instead of a
 * nonsense number.
 */
export function calculateDeposit({
  amount,
  annualRatePercent,
  term,
  termUnit,
  compounding,
  taxPercent,
  topUp,
}: DepositInput): DepositResult | null {
  const values = [amount, annualRatePercent, term, taxPercent, topUp]
  if (values.some((value) => !Number.isFinite(value))) return null
  if (amount <= 0 || term <= 0) return null
  if (annualRatePercent < 0 || topUp < 0) return null
  if (taxPercent < 0 || taxPercent > 100) return null

  const years = termInYears(term, termUnit)
  const periodsPerYear =
    compounding === 'end' ? UNCAPITALIZED_PERIODS_PER_YEAR : PERIODS_PER_YEAR[compounding]

  const schedule = buildSchedule({
    amount,
    rate: annualRatePercent / 100,
    years,
    periodsPerYear,
    capitalizes: compounding !== 'end',
    taxRate: taxPercent / 100,
    topUp,
  })
  if (!schedule) return null

  const totalContributed = amount + schedule.reduce((sum, period) => sum + period.topUp, 0)
  const grossInterest = schedule.reduce((sum, period) => sum + period.grossInterest, 0)
  const tax = schedule.reduce((sum, period) => sum + period.tax, 0)
  const netInterest = grossInterest - tax
  const finalAmount = schedule[schedule.length - 1].closingBalance

  return {
    totalContributed,
    grossInterest,
    tax,
    netInterest,
    finalAmount,
    effectiveAnnualRatePercent: effectiveAnnualRate(schedule, amount, finalAmount, periodsPerYear),
    schedule,
  }
}

function buildSchedule({
  amount,
  rate,
  years,
  periodsPerYear,
  capitalizes,
  taxRate,
  topUp,
}: {
  amount: number
  rate: number
  years: number
  periodsPerYear: number
  capitalizes: boolean
  taxRate: number
  topUp: number
}): DepositPeriod[] | null {
  const exactPeriods = years * periodsPerYear
  // A hair of tolerance so e.g. 14 months / quarterly doesn't come out
  // as 4.6666666 full periods plus a 0.9999999 stub.
  const fullPeriods = Math.floor(exactPeriods + 1e-9)
  const stub = exactPeriods - fullPeriods
  const rowCount = fullPeriods + (stub > 1e-9 ? 1 : 0)
  if (rowCount < 1 || rowCount > MAX_PERIODS) return null

  const periodRate = rate / periodsPerYear
  const schedule: DepositPeriod[] = []

  // The balance interest is charged on, and — when interest is *not*
  // capitalized — the separate pot of interest already earned but not
  // yet added to it. Capitalizing just means folding the pot back in
  // every period, so both cases share one loop.
  let base = amount
  let uncapitalized = 0
  // Running totals for the uncapitalized case, where rounding must not
  // accumulate — see the comment in the loop.
  let exactInterestSoFar = 0
  let roundedInterestSoFar = 0
  let roundedTaxSoFar = 0

  for (let index = 1; index <= rowCount; index += 1) {
    const openingBalance = base + uncapitalized
    // The first period opens with the initial deposit alone; top-ups
    // start from the second, so each one earns a full period.
    const periodTopUp = index === 1 ? 0 : topUp
    base += periodTopUp

    const fraction = index <= fullPeriods ? 1 : stub
    const exactInterest = base * periodRate * fraction

    let grossInterest: number
    let tax: number
    if (capitalizes) {
      // Capitalized interest is really paid to the depositor each
      // period, so the bank rounds it to cents there and then, and it's
      // the rounded amount that compounds on.
      grossInterest = round2(exactInterest)
      tax = round2(grossInterest * taxRate)
    } else {
      // Nothing is paid out until the end, so rounding each period would
      // just accumulate error against the plain "principal x rate x
      // term" figure the depositor expects. Round the running total
      // instead and show each row as the difference: the rows still add
      // up to the total exactly, but the total stays exact.
      exactInterestSoFar += exactInterest
      const roundedInterest = round2(exactInterestSoFar)
      const roundedTax = round2(exactInterestSoFar * taxRate)
      grossInterest = round2(roundedInterest - roundedInterestSoFar)
      tax = round2(roundedTax - roundedTaxSoFar)
      roundedInterestSoFar = roundedInterest
      roundedTaxSoFar = roundedTax
    }
    const netInterest = grossInterest - tax

    if (capitalizes) {
      base += netInterest
    } else {
      uncapitalized += netInterest
    }

    schedule.push({
      index,
      openingBalance,
      topUp: periodTopUp,
      grossInterest,
      tax,
      netInterest,
      closingBalance: base + uncapitalized,
      fraction,
    })
  }

  return schedule
}

/**
 * The annual rate that makes the money paid in grow to the payout — an
 * IRR, so that top-ups made late in the term are credited only for the
 * time they were actually invested. Found by bisection: with every
 * contribution negative and a single positive payout, present value
 * falls monotonically as the rate rises, so the search can't get stuck.
 */
function effectiveAnnualRate(
  schedule: DepositPeriod[],
  amount: number,
  finalAmount: number,
  periodsPerYear: number,
): number {
  const contributions = [{ years: 0, value: amount }]
  for (const period of schedule) {
    if (period.topUp > 0) {
      contributions.push({ years: (period.index - 1) / periodsPerYear, value: period.topUp })
    }
  }
  const totalYears = schedule.reduce((sum, period) => sum + period.fraction, 0) / periodsPerYear
  if (totalYears <= 0) return 0

  // Present value of what you get minus what you put in, at rate r.
  const netPresentValue = (rate: number) =>
    finalAmount / (1 + rate) ** totalYears -
    contributions.reduce((sum, c) => sum + c.value / (1 + rate) ** c.years, 0)

  if (netPresentValue(0) <= 0) return 0

  let low = 0
  let high = 10 // 1000% a year — far above any real deposit.
  if (netPresentValue(high) > 0) return high * 100
  for (let i = 0; i < 200; i += 1) {
    const mid = (low + high) / 2
    if (netPresentValue(mid) > 0) low = mid
    else high = mid
  }
  return ((low + high) / 2) * 100
}
