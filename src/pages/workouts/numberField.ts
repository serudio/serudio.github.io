/**
 * A number field without its up/down arrows.
 *
 * `type="number"` stays — it is what brings up the numeric keypad on a
 * phone and keeps letters out of a rep count — but the spinners earn
 * nothing here. Reps are typed, not nudged one at a time, and in a grid
 * cell 34 pixels wide the arrows appear on hover and squeeze the number
 * they are meant to be adjusting.
 *
 * Applied to the input itself; on a MUI field, nest it under `& input`.
 */
export const noSpinners = {
  MozAppearance: 'textfield',
  '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
} as const
