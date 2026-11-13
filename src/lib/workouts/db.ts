import { supabase } from '../supabase'

/**
 * Workouts data access.
 *
 * Every row belongs to the signed-in account: row-level security in
 * migration 0020 scopes both tables to auth.uid(), so nothing here
 * filters by user — the database does it, and cannot be talked out of
 * it by the client.
 *
 * A set is the unit. A cell in the grid is one row, which is why
 * editing a cell is an upsert on its slot and clearing it is a delete.
 */

export interface Exercise {
  id: string
  name: string
  sortOrder: number
}

export interface WorkoutSet {
  id: string
  exerciseId: string
  /** A DATE, "2026-11-13". */
  doneOn: string
  reps: number
  /** Which set of that day this is, and so which column it occupies. */
  slot: number
}

export interface YearTotal {
  year: number
  reps: number
  sets: number
}

const REQUEST_TIMEOUT_MS = 8000

/** The columns the unique index in migration 0020 covers. */
const SLOT_CONFLICT = 'user_id,exercise_id,done_on,sort_order'

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

function toSet(row: Record<string, unknown>): WorkoutSet {
  return {
    id: row.id as string,
    exerciseId: row.exercise_id as string,
    doneOn: row.done_on as string,
    reps: row.reps as number,
    slot: (row.sort_order as number) ?? 0,
  }
}

/* --------------------------------------------------------- exercises */

export async function getExercises(): Promise<Exercise[]> {
  const { data, error } = await client()
    .from('workout_exercises')
    .select('id, name, sort_order')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })
    .abortSignal(signal())
  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    sortOrder: (row.sort_order as number) ?? 0,
  }))
}

export async function createExercise(name: string, sortOrder = 0): Promise<Exercise> {
  const { data, error } = await client()
    .from('workout_exercises')
    .insert({ user_id: await currentUserId(), name: name.trim(), sort_order: sortOrder })
    .select('id, name, sort_order')
    .single()
  if (error) throw error

  return {
    id: data.id as string,
    name: data.name as string,
    sortOrder: (data.sort_order as number) ?? 0,
  }
}

export async function renameExercise(id: string, name: string) {
  const { error } = await client()
    .from('workout_exercises')
    .update({ name: name.trim() })
    .eq('id', id)
  if (error) throw error
}

/** Its sets go with it: they cascade on the exercise's foreign key. */
export async function deleteExercise(id: string) {
  const { error } = await client().from('workout_exercises').delete().eq('id', id)
  if (error) throw error
}

/* -------------------------------------------------------------- sets */

/**
 * One line per year, for the years that are not open.
 *
 * Collapsed means not fetched — see the comment on the function in
 * migration 0020.
 */
export async function getYearTotals(): Promise<YearTotal[]> {
  const { data, error } = await client().rpc('workout_year_totals')
  if (error) throw error

  return (data ?? []).map((row: Record<string, unknown>) => ({
    year: row.year as number,
    reps: Number(row.reps ?? 0),
    sets: Number(row.sets ?? 0),
  }))
}

export async function getYear(year: number): Promise<WorkoutSet[]> {
  const { data, error } = await client()
    .from('workout_sets')
    .select('id, exercise_id, done_on, reps, sort_order')
    .gte('done_on', `${year}-01-01`)
    .lte('done_on', `${year}-12-31`)
    .order('done_on', { ascending: true })
    .order('sort_order', { ascending: true })
    .abortSignal(signal())
  if (error) throw error

  return (data ?? []).map((row) => toSet(row as Record<string, unknown>))
}

/**
 * Writes one cell.
 *
 * An upsert on the slot rather than "look, then insert or update": two
 * taps on a phone, or the same day open in two tabs, would otherwise
 * race and record the set twice. The unique index decides.
 */
export async function setCell(input: {
  exerciseId: string
  doneOn: string
  slot: number
  reps: number
}): Promise<WorkoutSet> {
  const { data, error } = await client()
    .from('workout_sets')
    .upsert(
      {
        user_id: await currentUserId(),
        exercise_id: input.exerciseId,
        done_on: input.doneOn,
        reps: input.reps,
        sort_order: input.slot,
      },
      { onConflict: SLOT_CONFLICT },
    )
    .select('id, exercise_id, done_on, reps, sort_order')
    .single()
  if (error) throw error
  return toSet(data as Record<string, unknown>)
}

export async function clearCell(id: string) {
  const { error } = await client().from('workout_sets').delete().eq('id', id)
  if (error) throw error
}

/**
 * Quick add: the same number of reps, so many times, appended after
 * whatever that exercise already has on that day.
 */
export async function addSets(input: {
  exerciseId: string
  doneOn: string
  reps: number
  count: number
  firstSlot: number
}): Promise<WorkoutSet[]> {
  const userId = await currentUserId()
  const rows = Array.from({ length: input.count }, (_ignored, index) => ({
    user_id: userId,
    exercise_id: input.exerciseId,
    done_on: input.doneOn,
    reps: input.reps,
    sort_order: input.firstSlot + index,
  }))

  const { data, error } = await client()
    .from('workout_sets')
    .upsert(rows, { onConflict: SLOT_CONFLICT })
    .select('id, exercise_id, done_on, reps, sort_order')
  if (error) throw error
  return (data ?? []).map((row) => toSet(row as Record<string, unknown>))
}

/**
 * Copies a run of sets somewhere else — to another exercise on the same
 * day, or to another day for the same exercise.
 *
 * Appends rather than replaces. Overwriting would silently destroy sets
 * already recorded there, and getting them back means remembering what
 * they were.
 */
export async function copySets(input: {
  reps: number[]
  toExerciseId: string
  toDay: string
  firstSlot: number
}): Promise<WorkoutSet[]> {
  const userId = await currentUserId()
  const rows = input.reps.map((reps, index) => ({
    user_id: userId,
    exercise_id: input.toExerciseId,
    done_on: input.toDay,
    reps,
    sort_order: input.firstSlot + index,
  }))

  const { data, error } = await client()
    .from('workout_sets')
    .upsert(rows, { onConflict: SLOT_CONFLICT })
    .select('id, exercise_id, done_on, reps, sort_order')
  if (error) throw error
  return (data ?? []).map((row) => toSet(row as Record<string, unknown>))
}
