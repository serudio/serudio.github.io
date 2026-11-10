/**
 * The tint under the row the pointer is on.
 *
 * Sections are dense columns of checkbox-sized rows, so the cursor alone
 * does not say which one a click will land on — especially in a wide
 * three-column layout where the nearest text can belong to another
 * section. The negative margin lets the tint reach past the text into
 * the section's padding, so it reads as a row rather than a highlighted
 * word.
 *
 * Shared by the trip page and the shared-link page so a row behaves the
 * same in both.
 */
export const ROW_HOVER = {
  borderRadius: 1,
  mx: -0.5,
  px: 0.5,
  transition: 'background-color 120ms',
  '&:hover': { bgcolor: 'action.hover' },
} as const
