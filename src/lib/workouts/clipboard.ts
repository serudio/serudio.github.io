import type { DayRow } from './grid'
import type { WorkoutSet } from './db'

/**
 * Copying a block of cells out of the grid, and working out what
 * pasting one back in would do.
 *
 * Here rather than in the component because this is the part that can
 * destroy records: a block dropped one row off, or a value misread as a
 * number, writes over training that was done. It is all arithmetic over
 * plain lists, so it can be checked on its own.
 */

/** A set column, as the grid lays them out left to right. */
export interface Column {
  exerciseId: string
  slot: number
}

/** The selected rectangle, in row and column indexes. */
export interface Block {
  top: number
  bottom: number
  left: number
  right: number
}

/** One cell a paste wants to fill. */
export interface PasteCell {
  day: string
  exerciseId: string
  slot: number
  reps: number
}

export interface PastePlan {
  write: PasteCell[]
  /** Sets the pasted block leaves empty, to be deleted. */
  clear: WorkoutSet[]
  /**
   * How many records the paste destroys — cells it replaces plus cells
   * it empties. What the page asks about before going ahead; a paste
   * onto empty days asks nothing.
   */
  overwrites: number
}

const at = (rows: DayRow[], columns: Column[], row: number, col: number) => {
  const column = columns[col]
  return column ? rows[row]?.slots[column.exerciseId]?.[column.slot] : undefined
}

/** The selection as a spreadsheet reads it: tabs across, newlines down. */
export function toTsv(block: Block, rows: DayRow[], columns: Column[]): string {
  const lines: string[] = []
  for (let row = block.top; row <= block.bottom; row += 1) {
    const line: string[] = []
    for (let col = block.left; col <= block.right; col += 1) {
      const set = at(rows, columns, row, col)
      // An empty cell copies as an empty cell, never as a zero: zero is
      // not a set that happened.
      line.push(set ? String(set.reps) : '')
    }
    lines.push(line.join('\t'))
  }
  return lines.join('\n')
}

/** Pasted text as a grid of strings, however the source ended its lines. */
function parse(text: string): string[][] {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/\n+$/, '')
    .split('\n')
    .map((line) => line.split('\t'))
}

/**
 * What pasting this text over this selection would write and delete.
 *
 * A single value fills the whole selection, the way a spreadsheet does.
 * Anything larger is laid down from the top-left corner and clipped to
 * the grid it lands in, so a block dragged in from a longer year cannot
 * run off the end of this one.
 */
export function planPaste(
  text: string,
  block: Block,
  rows: DayRow[],
  columns: Column[],
): PastePlan {
  const pasted = parse(text)
  const plan: PastePlan = { write: [], clear: [], overwrites: 0 }
  if (pasted.length === 0) return plan

  const one = pasted.length === 1 && pasted[0].length === 1
  const width = Math.max(...pasted.map((line) => line.length))
  const lastRow = one
    ? Math.min(rows.length - 1, block.bottom)
    : Math.min(rows.length - 1, block.top + pasted.length - 1)
  const lastCol = one
    ? Math.min(columns.length - 1, block.right)
    : Math.min(columns.length - 1, block.left + width - 1)

  for (let row = block.top; row <= lastRow; row += 1) {
    for (let col = block.left; col <= lastCol; col += 1) {
      const day = rows[row]
      const column = columns[col]
      if (!day || !column) continue

      const existing = at(rows, columns, row, col)
      const raw = one ? pasted[0][0] : (pasted[row - block.top]?.[col - block.left] ?? '')
      const reps = Number.parseInt(raw.trim(), 10)

      // The same rule as typing into a cell: anything that is not a
      // positive number empties it.
      if (!Number.isFinite(reps) || reps <= 0) {
        if (existing) plan.clear.push(existing)
        continue
      }
      // Already that number: nothing to write, and nothing destroyed.
      if (existing?.reps === reps) continue
      if (existing) plan.overwrites += 1
      plan.write.push({
        day: day.date,
        exerciseId: column.exerciseId,
        slot: column.slot,
        reps,
      })
    }
  }

  plan.overwrites += plan.clear.length
  return plan
}
