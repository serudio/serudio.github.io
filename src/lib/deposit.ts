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
export type Compounding =
  | "end"
  | "monthly"
  | "quarterly"
  | "semiannually"
  | "annually";

/**
 * The options offered in the UI, in order. "quarterly" is switched off
 * for now but deliberately left in the type and in PERIODS_PER_YEAR
 * below, so bringing it back is just uncommenting this one line — and so
 * a stored preference of "quarterly" still type-checks (readSavedForm
 * falls back to the default for anything not in this list).
 */
export const COMPOUNDING_OPTIONS: Compounding[] = [
  "end",
  "monthly",
  // "quarterly",
  "semiannually",
  "annually",
];

/** Compounding periods per year. 'end' means no capitalization at all. */
const PERIODS_PER_YEAR: Record<Exclude<Compounding, "end">, number> = {
  monthly: 12,
  quarterly: 4,
  semiannually: 2,
  annually: 1,
};

/**
 * Without capitalization there's no natural period to break the term
 * into, so the schedule falls back to months — which is also where
 * top-ups land in that case.
 */
const UNCAPITALIZED_PERIODS_PER_YEAR = 12;

/**
 * Upper bound on schedule rows, so a stray "9999 years, monthly" can't
 * lock the page up building a table nobody asked for.
 */
const MAX_PERIODS = 1200;

export type TermUnit = "months" | "years";

export interface DepositInput {
  /** Initial deposit. */
  amount: number;
  /** Nominal annual interest rate, in percent (e.g. 12.5). */
  annualRatePercent: number;
  term: number;
  termUnit: TermUnit;
  compounding: Compounding;
  /**
   * Tax withheld from earned interest, in percent. Deposit interest is
   * taxable in many countries and the rate changes with the law, so it's
   * an input rather than a built-in constant — 0 means "don't model tax".
   */
  taxPercent: number;
  /**
   * Expected annual inflation, in percent. Used only to restate the
   * result in today's money — it never changes what the bank pays, just
   * what that payout will be worth. 0 leaves the figures nominal.
   * Negative values (deflation) are allowed; -100 or below is not, since
   * money would have no value left to measure.
   */
  inflationPercent: number;
  /**
   * Regular top-up paid in at the start of every period except the
   * first, so every top-up earns a full period of interest and there's
   * no pointless contribution on the closing day. 0 means "no top-ups".
   */
  topUp: number;
}

/** One period of the deposit — a single row of the breakdown table. */
export interface DepositPeriod {
  /** 1-based period number, counted across the whole term. */
  index: number;
  /** 1-based year of the term this period falls in. */
  year: number;
  /** 1-based period number within that year (e.g. quarter 1-4). */
  indexInYear: number;
  /** Balance this period started with, before the top-up. */
  openingBalance: number;
  /** Top-up paid in at the start of this period (0 for the first). */
  topUp: number;
  /** Interest accrued over this period, before tax. */
  grossInterest: number;
  /** Tax withheld from this period's interest. */
  tax: number;
  /** Interest kept — added to the balance when capitalizing. */
  netInterest: number;
  /** What the deposit is worth at the end of this period. */
  closingBalance: number;
  /**
   * How much of a full period this row covers — 1 for a whole
   * month/quarter/year, less for a final stub period (e.g. a 14-month
   * term with quarterly capitalization ends with 2/3 of a quarter).
   */
  fraction: number;
}

export interface DepositResult {
  /**
   * Schedule rows per year — 12, 4 or 1 depending on capitalization, and
   * 12 when interest isn't capitalized at all.
   */
  periodsPerYear: number;
  /** Initial deposit plus every top-up — the money you put in. */
  totalContributed: number;
  /** Interest earned over the whole term, before tax. */
  grossInterest: number;
  /** Total tax withheld from that interest. */
  tax: number;
  /** Interest actually kept, after tax. */
  netInterest: number;
  /** What's paid out at the end. */
  finalAmount: number;
  /**
   * The annual return the deposit actually delivers on the money you put
   * in, after capitalization and tax. With top-ups this is a money-
   * weighted rate (an IRR), since later contributions earn interest for
   * less time than the initial one.
   */
  effectiveAnnualRatePercent: number;
  /**
   * The payout restated in today's money — what it will actually buy
   * once inflation has eaten into it. Equal to finalAmount when the
   * inflation input is 0.
   */
  realFinalAmount: number;
  /**
   * What you paid in, also restated in today's money. Each top-up is
   * discounted from the date it was made, because a contribution three
   * years from now costs less in today's terms than the same number paid
   * in today — comparing it against an undiscounted total would
   * overstate the loss.
   */
  realTotalContributed: number;
  /**
   * The gain in purchasing power: realFinalAmount minus
   * realTotalContributed. Negative when the deposit earns less than
   * inflation, which is the number this whole feature exists to show.
   */
  realNetInterest: number;
  /** The effective annual rate after inflation. */
  realEffectiveAnnualRatePercent: number;
  /** Period-by-period breakdown. */
  schedule: DepositPeriod[];
  /** The same rows grouped into years, each with its own totals. */
  years: DepositYear[];
}

/**
 * One year of the schedule and what it added up to. The flow amounts are
 * sums of that year's rows, but the two balances are snapshots, not
 * sums: a balance can't be added up, so opening is where the year
 * started and closing is where it ended.
 */
export interface DepositYear {
  year: number;
  /** Balance at the start of the year, before that year's first top-up. */
  openingBalance: number;
  /** Top-ups paid in during the year. */
  topUp: number;
  /** Interest accrued during the year, before tax. */
  grossInterest: number;
  /** Tax withheld during the year. */
  tax: number;
  /** Interest kept during the year. */
  netInterest: number;
  /** Balance at the end of the year. */
  closingBalance: number;
  /** The periods making up this year, in order. */
  rows: DepositPeriod[];
}

/**
 * Splits a schedule into consecutive years and totals each one. Lives
 * here rather than in the widget so the year totals are summed from the
 * same rows the table prints — they can't drift apart.
 */
export function summarizeYears(schedule: DepositPeriod[]): DepositYear[] {
  const years: DepositYear[] = [];

  for (const row of schedule) {
    let current = years[years.length - 1];

    if (current?.year !== row.year) {
      current = {
        year: row.year,
        openingBalance: row.openingBalance,
        topUp: 0,
        grossInterest: 0,
        tax: 0,
        netInterest: 0,
        closingBalance: row.closingBalance,
        rows: [],
      };
      years.push(current);
    }

    current.topUp += row.topUp;
    current.grossInterest += row.grossInterest;
    current.tax += row.tax;
    current.netInterest += row.netInterest;
    // Each row supersedes the last, so after the loop this holds the
    // final period's balance for the year.
    current.closingBalance = row.closingBalance;
    current.rows.push(row);
  }

  return years;
}

function termInYears(term: number, unit: TermUnit): number {
  return unit === "years" ? term : term / 12;
}

/** Money rounds to cents, the way a bank's own statement does. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
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
  inflationPercent,
}: DepositInput): DepositResult | null {
  const values = [
    amount,
    annualRatePercent,
    term,
    taxPercent,
    topUp,
    inflationPercent,
  ];
  if (values.some((value) => !Number.isFinite(value))) return null;
  if (amount <= 0 || term <= 0) return null;
  if (annualRatePercent < 0 || topUp < 0) return null;
  if (taxPercent < 0 || taxPercent > 100) return null;
  if (inflationPercent <= -100) return null;

  const years = termInYears(term, termUnit);
  const periodsPerYear =
    compounding === "end"
      ? UNCAPITALIZED_PERIODS_PER_YEAR
      : PERIODS_PER_YEAR[compounding];

  const schedule = buildSchedule({
    amount,
    rate: annualRatePercent / 100,
    years,
    periodsPerYear,
    capitalizes: compounding !== "end",
    taxRate: taxPercent / 100,
    topUp,
  });
  if (!schedule) return null;

  const totalContributed =
    amount + schedule.reduce((sum, period) => sum + period.topUp, 0);
  const grossInterest = schedule.reduce(
    (sum, period) => sum + period.grossInterest,
    0,
  );
  const tax = schedule.reduce((sum, period) => sum + period.tax, 0);
  const netInterest = grossInterest - tax;
  const finalAmount = schedule[schedule.length - 1].closingBalance;

  const totalYears = scheduleYears(schedule, periodsPerYear);
  const effectiveAnnualRatePercent = effectiveAnnualRate(
    schedule,
    amount,
    finalAmount,
    periodsPerYear,
    totalYears,
  );

  // Restating in today's money means discounting every amount from the
  // date it lands, so the payout and the contributions are compared at
  // the same point in time.
  const inflation = inflationPercent / 100;
  const inTodaysMoney = (value: number, atYears: number) =>
    value / (1 + inflation) ** atYears;

  const realFinalAmount = inTodaysMoney(finalAmount, totalYears);
  const realTotalContributed = schedule.reduce(
    (sum, period) =>
      period.topUp > 0
        ? sum + inTodaysMoney(period.topUp, (period.index - 1) / periodsPerYear)
        : sum,
    amount, // the initial deposit is already in today's money, at t=0
  );

  return {
    periodsPerYear,
    totalContributed,
    grossInterest,
    tax,
    netInterest,
    finalAmount,
    effectiveAnnualRatePercent,
    realFinalAmount,
    realTotalContributed,
    realNetInterest: realFinalAmount - realTotalContributed,
    // Discounting every cash flow by a constant rate shifts the IRR by
    // exactly this much (the Fisher relation), so the real rate follows
    // from the nominal one — no second solve needed.
    realEffectiveAnnualRatePercent:
      ((1 + effectiveAnnualRatePercent / 100) / (1 + inflation) - 1) * 100,
    schedule,
    years: summarizeYears(schedule),
  };
}

/** Length of the schedule in years, stub period included. */
function scheduleYears(
  schedule: DepositPeriod[],
  periodsPerYear: number,
): number {
  return (
    schedule.reduce((sum, period) => sum + period.fraction, 0) / periodsPerYear
  );
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
  amount: number;
  rate: number;
  years: number;
  periodsPerYear: number;
  capitalizes: boolean;
  taxRate: number;
  topUp: number;
}): DepositPeriod[] | null {
  const exactPeriods = years * periodsPerYear;
  // A hair of tolerance so e.g. 14 months / quarterly doesn't come out
  // as 4.6666666 full periods plus a 0.9999999 stub.
  const fullPeriods = Math.floor(exactPeriods + 1e-9);
  const stub = exactPeriods - fullPeriods;
  const rowCount = fullPeriods + (stub > 1e-9 ? 1 : 0);
  if (rowCount < 1 || rowCount > MAX_PERIODS) return null;

  const periodRate = rate / periodsPerYear;
  const schedule: DepositPeriod[] = [];

  // The balance interest is charged on, and — when interest is *not*
  // capitalized — the separate pot of interest already earned but not
  // yet added to it. Capitalizing just means folding the pot back in
  // every period, so both cases share one loop.
  let base = amount;
  let uncapitalized = 0;
  // Running totals for the uncapitalized case, where rounding must not
  // accumulate — see the comment in the loop.
  let exactInterestSoFar = 0;
  let roundedInterestSoFar = 0;
  let roundedTaxSoFar = 0;

  for (let index = 1; index <= rowCount; index += 1) {
    const openingBalance = base + uncapitalized;
    // The first period opens with the initial deposit alone; top-ups
    // start from the second, so each one earns a full period.
    const periodTopUp = index === 1 ? 0 : topUp;
    base += periodTopUp;

    const fraction = index <= fullPeriods ? 1 : stub;
    const exactInterest = base * periodRate * fraction;

    let grossInterest: number;
    let tax: number;
    if (capitalizes) {
      // Capitalized interest is really paid to the depositor each
      // period, so the bank rounds it to cents there and then, and it's
      // the rounded amount that compounds on.
      grossInterest = round2(exactInterest);
      tax = round2(grossInterest * taxRate);
    } else {
      // Nothing is paid out until the end, so rounding each period would
      // just accumulate error against the plain "principal x rate x
      // term" figure the depositor expects. Round the running total
      // instead and show each row as the difference: the rows still add
      // up to the total exactly, but the total stays exact.
      exactInterestSoFar += exactInterest;
      const roundedInterest = round2(exactInterestSoFar);
      const roundedTax = round2(exactInterestSoFar * taxRate);
      grossInterest = round2(roundedInterest - roundedInterestSoFar);
      tax = round2(roundedTax - roundedTaxSoFar);
      roundedInterestSoFar = roundedInterest;
      roundedTaxSoFar = roundedTax;
    }
    const netInterest = grossInterest - tax;

    if (capitalizes) {
      base += netInterest;
    } else {
      uncapitalized += netInterest;
    }

    schedule.push({
      index,
      year: Math.floor((index - 1) / periodsPerYear) + 1,
      indexInYear: ((index - 1) % periodsPerYear) + 1,
      openingBalance,
      topUp: periodTopUp,
      grossInterest,
      tax,
      netInterest,
      closingBalance: base + uncapitalized,
      fraction,
    });
  }

  return schedule;
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
  totalYears: number,
): number {
  const contributions = [{ years: 0, value: amount }];
  for (const period of schedule) {
    if (period.topUp > 0) {
      contributions.push({
        years: (period.index - 1) / periodsPerYear,
        value: period.topUp,
      });
    }
  }
  if (totalYears <= 0) return 0;

  // Present value of what you get minus what you put in, at rate r.
  const netPresentValue = (rate: number) =>
    finalAmount / (1 + rate) ** totalYears -
    contributions.reduce((sum, c) => sum + c.value / (1 + rate) ** c.years, 0);

  if (netPresentValue(0) <= 0) return 0;

  let low = 0;
  let high = 10; // 1000% a year — far above any real deposit.
  if (netPresentValue(high) > 0) return high * 100;
  for (let i = 0; i < 200; i += 1) {
    const mid = (low + high) / 2;
    if (netPresentValue(mid) > 0) low = mid;
    else high = mid;
  }
  return ((low + high) / 2) * 100;
}
