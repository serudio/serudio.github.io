import { supabase } from '../supabase'

/**
 * Goals data access.
 *
 * Every row here belongs to the signed-in account: row-level security in
 * migration 0019 scopes the table to auth.uid(), so these queries never
 * filter by user themselves — the database does it, and cannot be talked
 * out of it by the client.
 *
 * A step is a goal with a parent, which is why there is one set of
 * functions rather than two.
 */

export interface Goal {
  id: string
  /** Null for a goal in its own right; set for a step of another. */
  parentId: string | null
  title: string
  /** A DATE, "2026-11-05", or null for no deadline. */
  dueOn: string | null
  /** When it was finished; null while it is not. */
  doneAt: string | null
  sortOrder: number
  createdAt: string
}

/**
 * How deep a goal may be nested. Enforced by a trigger in migration
 * 0019 — this constant only keeps the UI from offering a step the
 * database would refuse.
 */
export const MAX_GOAL_DEPTH = 10

const REQUEST_TIMEOUT_MS = 8000

function client() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

function signal() {
  return AbortSignal.timeout(REQUEST_TIMEOUT_MS)
}

async function currentUserId(): Promise<string> {
  const { data } = await client().auth.getUser()
  if (!data.user) throw new Error('Not signed in')
  return data.user.id
}

function toGoal(row: Record<string, unknown>): Goal {
  return {
    id: row.id as string,
    parentId: (row.parent_id as string | null) ?? null,
    title: row.title as string,
    dueOn: (row.due_on as string | null) ?? null,
    doneAt: (row.done_at as string | null) ?? null,
    sortOrder: (row.sort_order as number) ?? 0,
    createdAt: row.created_at as string,
  }
}

/**
 * The account's whole tree, flat.
 *
 * One query for everything rather than a level at a time: a personal
 * goals list is small, the page needs every row anyway to work out which
 * deadline is the earliest anywhere beneath a goal, and a recursive CTE
 * would be machinery for nothing.
 */
export async function getGoals(): Promise<Goal[]> {
  const { data, error } = await client()
    .from('goals')
    .select('id, parent_id, title, due_on, done_at, sort_order, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .abortSignal(signal())
  if (error) throw error

  return (data ?? []).map((row) => toGoal(row as Record<string, unknown>))
}

export async function createGoal(input: {
  title: string
  parentId?: string | null
  dueOn?: string | null
  sortOrder?: number
}): Promise<Goal> {
  const { data, error } = await client()
    .from('goals')
    .insert({
      user_id: await currentUserId(),
      parent_id: input.parentId ?? null,
      title: input.title.trim(),
      due_on: input.dueOn || null,
      sort_order: input.sortOrder ?? 0,
    })
    .select('id, parent_id, title, due_on, done_at, sort_order, created_at')
    .single()
  if (error) throw error
  return toGoal(data as Record<string, unknown>)
}

export async function updateGoal(
  id: string,
  input: { title?: string; dueOn?: string | null; doneAt?: string | null },
) {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.title !== undefined) patch.title = input.title.trim()
  if (input.dueOn !== undefined) patch.due_on = input.dueOn || null
  if (input.doneAt !== undefined) patch.done_at = input.doneAt

  const { error } = await client().from('goals').update(patch).eq('id', id)
  if (error) throw error
}

/** Steps go with it: they cascade on the parent's foreign key. */
export async function deleteGoal(id: string) {
  const { error } = await client().from('goals').delete().eq('id', id)
  if (error) throw error
}
