import { addDays } from '../formatDate'
import type { Goal } from './db'

/**
 * Turning the flat rows into the thing the page shows.
 *
 * Kept apart from the page because this is where the judgements live —
 * which deadline a goal is really running against, and what counts as
 * late — and those are worth being able to read and check on their own.
 */

export interface GoalNode {
  goal: Goal
  /** 0 for a goal in its own right, 1 for its steps, and so on. */
  depth: number
  children: GoalNode[]
  /** How many of the goals beneath this one are finished, out of how many. */
  done: number
  total: number
  /**
   * The earliest deadline still outstanding anywhere in this subtree,
   * its own included, or null if nothing beneath it has one.
   *
   * Finished goals are left out: a step that was late and is now done
   * has stopped being a thing to worry about, and keeping its date here
   * would flag the whole goal red forever.
   */
  earliestDue: string | null
}

export type Bucket = 'overdue' | 'today' | 'week' | 'later' | 'someday' | 'done'

/** Rendering order, most urgent first; finished work last. */
export const BUCKETS: Bucket[] = ['overdue', 'today', 'week', 'later', 'someday', 'done']

function byOrder(a: GoalNode, b: GoalNode): number {
  return (
    a.goal.sortOrder - b.goal.sortOrder ||
    a.goal.createdAt.localeCompare(b.goal.createdAt)
  )
}

/**
 * Builds the forest, with depth, counts and deadlines already worked out.
 *
 * Traversal is iterative and keeps a visited set. The database refuses a
 * cycle (migration 0019), but a cycle arriving anyway — through a stale
 * cache, a hand-edited row — must not turn this into an infinite
 * descent: anything unreachable from a root is simply left out, which
 * loses a row rather than hanging the page.
 */
export function buildTree(goals: Goal[]): GoalNode[] {
  const nodes = new Map<string, GoalNode>()
  for (const goal of goals) {
    nodes.set(goal.id, {
      goal,
      depth: 0,
      children: [],
      done: 0,
      total: 0,
      earliestDue: null,
    })
  }

  const roots: GoalNode[] = []
  for (const node of nodes.values()) {
    const parentId = node.goal.parentId
    const parent = parentId ? nodes.get(parentId) : undefined
    // A parent that is not in the list — deleted in another tab, say —
    // would otherwise take its children out of the page with it.
    if (parent) parent.children.push(node)
    else roots.push(node)
  }

  roots.sort(byOrder)
  for (const node of nodes.values()) node.children.sort(byOrder)

  // Pre-order walk to assign depth, collecting the order so the counts
  // below can be aggregated by walking it backwards: a node is always
  // reached before its children, so reversed it is always after them.
  const order: GoalNode[] = []
  const seen = new Set<string>()
  const stack = [...roots].reverse()

  while (stack.length > 0) {
    const node = stack.pop()!
    if (seen.has(node.goal.id)) continue
    seen.add(node.goal.id)
    order.push(node)

    for (let index = node.children.length - 1; index >= 0; index -= 1) {
      const child = node.children[index]
      child.depth = node.depth + 1
      stack.push(child)
    }
  }

  for (let index = order.length - 1; index >= 0; index -= 1) {
    const node = order[index]
    const own = node.goal.doneAt ? null : node.goal.dueOn
    let earliest = own

    for (const child of node.children) {
      node.total += child.total + 1
      node.done += child.done + (child.goal.doneAt ? 1 : 0)
      if (child.earliestDue && (!earliest || child.earliestDue < earliest)) {
        earliest = child.earliestDue
      }
    }

    node.earliestDue = earliest
  }

  return roots
}

/**
 * Which heading a goal belongs under.
 *
 * It answers to the earliest deadline in its whole subtree, not just its
 * own. Something late at depth seven is the hardest thing to notice and
 * the most worth surfacing; a page that read only the top row's date
 * would hide exactly the thing it exists to show.
 */
export function bucketOf(node: GoalNode, today: string): Bucket {
  // Finishing every step is not the same as reaching the goal, so this
  // reads the goal's own state and never infers it from the children.
  if (node.goal.doneAt) return 'done'

  const due = node.earliestDue
  if (!due) return 'someday'
  if (due < today) return 'overdue'
  if (due === today) return 'today'
  if (due <= addDays(today, 6)) return 'week'
  return 'later'
}

export function groupByBucket(
  roots: GoalNode[],
  today: string,
): Record<Bucket, GoalNode[]> {
  const groups = Object.fromEntries(
    BUCKETS.map((bucket) => [bucket, [] as GoalNode[]]),
  ) as Record<Bucket, GoalNode[]>

  for (const root of roots) groups[bucketOf(root, today)].push(root)
  return groups
}

/**
 * The rows to draw, in order, with everything under a collapsed goal
 * left out. Steps always stay with their goal rather than being sorted
 * into headings of their own — a goal read apart from its steps is not
 * the thing being tracked.
 */
export function flatten(
  nodes: GoalNode[],
  collapsed: ReadonlySet<string>,
): GoalNode[] {
  const rows: GoalNode[] = []

  const walk = (list: GoalNode[]) => {
    for (const node of list) {
      rows.push(node)
      if (!collapsed.has(node.goal.id)) walk(node.children)
    }
  }

  walk(nodes)
  return rows
}
