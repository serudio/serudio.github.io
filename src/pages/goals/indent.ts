/**
 * How far in a row sits.
 *
 * Full steps for the first few levels, then a much smaller one: at ten
 * levels deep an even indent marches off the right-hand edge of a
 * phone, and past about four levels the indent has stopped reading as
 * structure anyway — the guide line does that work instead.
 *
 * Kept out of GoalRow.tsx so that file exports only a component, which
 * is what fast refresh needs — the same split as pageChrome.ts and
 * PageChromeProvider.tsx.
 */
export function indentFor(depth: number): number {
  return Math.min(depth, 4) * 14 + Math.max(0, depth - 4) * 4
}
