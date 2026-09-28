import { Compounding } from "../../../lib/deposit";
import { TermUnit } from "../../../lib/deposit";

export const TERM_UNITS: TermUnit[] = ["months", "years"];

/**
 * The form as it starts out, and what the reset button restores.
 */
export const DEFAULTS = {
  amount: "1000",
  rate: "14",
  term: "10",
  termUnit: "years" as TermUnit,
  compounding: "monthly" as Compounding,
  tax: "0",
  topUp: "1000",
  inflation: "0",
};
