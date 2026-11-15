import { supabase } from '../supabase'

/**
 * "100 todo" data access.
 *
 * Every row belongs to the signed-in account: row-level security in
 * migration 0022 scopes the table to auth.uid(), so nothing here filters
 * by user — the database does it, and cannot be talked out of it by the
 * client.
 */

export interface TodoItem {
  id: string
  text: string
  /** How big it is drawn, 1 to 9. */
  weight: number
  /** Index into PALETTE in src/pages/todo/colors.ts. */
  color: number
  sortOrder: number
  createdAt: string
}

/**
 * The size range, matching the CHECK constraint in migration 0022.
 * Clamping here is what stops "bigger" on a 9 becoming a failed request
 * instead of a no-op.
 */
export const MIN_WEIGHT = 1
export const MAX_WEIGHT = 9

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

const COLUMNS = 'id, text, weight, color, sort_order, created_at'

function toItem(row: Record<string, unknown>): TodoItem {
  return {
    id: row.id as string,
    text: row.text as string,
    weight: (row.weight as number) ?? 3,
    color: (row.color as number) ?? 0,
    sortOrder: (row.sort_order as number) ?? 0,
    createdAt: row.created_at as string,
  }
}

/**
 * The whole list, in the order it is drawn.
 *
 * Ordered by created_at after sort_order so the cloud is stable: items
 * added in one batch share a sort_order, and without the tiebreak they
 * would swap places between loads under the reader's hands.
 */
export async function getItems(): Promise<TodoItem[]> {
  const { data, error } = await client()
    .from('todo_items')
    .select(COLUMNS)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .abortSignal(signal())
  if (error) throw error

  return (data ?? []).map((row) => toItem(row as Record<string, unknown>))
}

export async function createItem(input: {
  text: string
  weight: number
  color: number
  sortOrder: number
}): Promise<TodoItem> {
  const { data, error } = await client()
    .from('todo_items')
    .insert({
      user_id: await currentUserId(),
      text: input.text.trim(),
      weight: input.weight,
      color: input.color,
      sort_order: input.sortOrder,
    })
    .select(COLUMNS)
    .single()
  if (error) throw error
  return toItem(data as Record<string, unknown>)
}

export async function updateItem(
  id: string,
  input: { text?: string; weight?: number; color?: number },
) {
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (input.text !== undefined) patch.text = input.text.trim()
  if (input.weight !== undefined) patch.weight = input.weight
  if (input.color !== undefined) patch.color = input.color

  const { error } = await client().from('todo_items').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteItem(id: string) {
  const { error } = await client().from('todo_items').delete().eq('id', id)
  if (error) throw error
}
