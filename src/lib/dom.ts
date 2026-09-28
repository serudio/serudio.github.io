import { type WheelEvent } from "react";

/**
 * A focused <input type="number"> treats the wheel as "nudge the value",
 * so scrolling the page with the pointer over a field silently edits the
 * deposit — easy to do here, since the breakdown table sits below the
 * form. Drop focus instead and let the page scroll.
 */
export function stopWheelEdit(event: WheelEvent<HTMLDivElement>) {
  const target = event.target as HTMLElement;
  if (document.activeElement === target) target.blur();
}
