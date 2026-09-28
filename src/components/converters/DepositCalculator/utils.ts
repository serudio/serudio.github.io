import {
  Compounding,
  COMPOUNDING_OPTIONS,
  type TermUnit,
} from "../../../lib/deposit";
import { DEFAULTS, TERM_UNITS } from "./constants";
import { SavedForm } from "./types";

/**
 * What one schedule row covers, for labelling. Without capitalization
 * the schedule falls back to months (see UNCAPITALIZED_PERIODS_PER_YEAR
 * in lib/deposit.ts), so 'end' is labelled monthly too.
 */
export function periodKey(
  compounding: Compounding,
): "monthly" | "quarterly" | "semiannually" | "annually" {
  return compounding === "end" ? "monthly" : compounding;
}

/**
 * Filling this in is real work — eight fields, several of them
 * considered — so a refresh shouldn't throw it away. Keyed like the
 * other visitor preferences (see src/i18n/index.ts, src/theme-mode.ts).
 * Values are stored as typed, not as parsed numbers, so a half-finished
 * entry comes back exactly as it was left.
 */
const STORAGE_KEY = "serudio_deposit";

export function readSavedForm(): SavedForm {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;

    const saved = JSON.parse(raw) as Partial<Record<keyof SavedForm, unknown>>;
    const text = (key: keyof SavedForm): string =>
      typeof saved[key] === "string" ? (saved[key] as string) : DEFAULTS[key];

    return {
      amount: text("amount"),
      rate: text("rate"),
      term: text("term"),
      // These two drive union types behind <TextField select>, so a value
      // that isn't a current option — hand-edited storage, or an option
      // dropped in a later version — has to fall back rather than leave
      // the control showing nothing.
      termUnit: TERM_UNITS.includes(saved.termUnit as TermUnit)
        ? (saved.termUnit as TermUnit)
        : DEFAULTS.termUnit,
      compounding: COMPOUNDING_OPTIONS.includes(
        saved.compounding as Compounding,
      )
        ? (saved.compounding as Compounding)
        : DEFAULTS.compounding,
      tax: text("tax"),
      topUp: text("topUp"),
      inflation: text("inflation"),
    };
  } catch {
    // Unreadable JSON, or storage blocked in private browsing.
    return DEFAULTS;
  }
}

export function saveForm(form: SavedForm): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  } catch {
    // Storage unavailable; the values just won't survive a refresh.
  }
}
