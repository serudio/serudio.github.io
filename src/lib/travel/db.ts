import { supabase } from '../supabase'
import { defaultTemplate } from '../../data/travel/defaultTemplate'
import type { RecommendedSet } from '../../data/travel/recommended'

/**
 * Travel data access.
 *
 * Everything here is the signed-in account's own: row-level security in
 * migration 0011 scopes every table to auth.uid(), so these queries never
 * filter by user themselves — the database does it, and cannot be talked
 * out of it by the client.
 *
 * A "section" in the UI is a category. Adding a recommended set to a trip
 * and adding it to the default list are the same operation against a
 * different trip, which is why the template is itself a trip row.
 */

export interface TravelCategory {
  id: string
  name: string
  color: string | null
  /** A section naming someone rather than a kind of thing. */
  isPerson: boolean
  /** The person section this one belongs to, if any. */
  personId: string | null
  sortOrder: number
}

export interface TravelTrip {
  id: string
  name: string
  startsOn: string | null
  endsOn: string | null
  isTemplate: boolean
  archived: boolean
  /** Set while the trip is shared by link; null once sharing is off. */
  shareToken: string | null
  createdAt: string
}

export interface TravelItem {
  id: string
  tripId: string
  categoryId: string | null
  text: string
  packed: boolean
  sortOrder: number
}

export interface TravelNote {
  id: string
  tripId: string
  text: string
  done: boolean
  sortOrder: number
}

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

/* ------------------------------------------------------------------ trips */

export async function getTrips(): Promise<TravelTrip[]> {
  const { data, error } = await client()
    .from('travel_trips')
    .select('id, name, starts_on, ends_on, is_template, archived, share_token, created_at')
    .order('created_at', { ascending: false })
    .abortSignal(signal())
  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    startsOn: row.starts_on as string | null,
    endsOn: row.ends_on as string | null,
    isTemplate: row.is_template as boolean,
    archived: row.archived as boolean,
    shareToken: (row.share_token as string | null) ?? null,
    createdAt: row.created_at as string,
  }))
}

export async function createTrip(input: {
  name: string
  startsOn?: string | null
  endsOn?: string | null
  isTemplate?: boolean
}): Promise<string> {
  const { data, error } = await client()
    .from('travel_trips')
    .insert({
      user_id: await currentUserId(),
      name: input.name.trim(),
      starts_on: input.startsOn || null,
      ends_on: input.endsOn || null,
      is_template: input.isTemplate ?? false,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id as string
}

export async function updateTrip(
  id: string,
  input: { name?: string; startsOn?: string | null; endsOn?: string | null; archived?: boolean },
) {
  const patch: Record<string, unknown> = {}
  if (input.name !== undefined) patch.name = input.name.trim()
  if (input.startsOn !== undefined) patch.starts_on = input.startsOn || null
  if (input.endsOn !== undefined) patch.ends_on = input.endsOn || null
  if (input.archived !== undefined) patch.archived = input.archived

  const { error } = await client().from('travel_trips').update(patch).eq('id', id)
  if (error) throw error
}

/** Items and notes go with it: both cascade on the trip's foreign key. */
export async function deleteTrip(id: string) {
  const { error } = await client().from('travel_trips').delete().eq('id', id)
  if (error) throw error
}

/* ------------------------------------------------- categories and people */

export async function getCategories(): Promise<TravelCategory[]> {
  const { data, error } = await client()
    .from('travel_categories')
    .select('id, name, color, is_person, person_id, sort_order')
    .order('sort_order', { ascending: true })
    .abortSignal(signal())
  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    color: row.color as string | null,
    isPerson: (row.is_person as boolean) ?? false,
    personId: (row.person_id as string | null) ?? null,
    sortOrder: row.sort_order as number,
  }))
}

export async function createCategory(input: {
  name: string
  color?: string | null
  isPerson?: boolean
  sortOrder?: number
}): Promise<string> {
  const { data, error } = await client()
    .from('travel_categories')
    .insert({
      user_id: await currentUserId(),
      name: input.name.trim(),
      color: input.color ?? null,
      is_person: input.isPerson ?? false,
      sort_order: input.sortOrder ?? 0,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id as string
}

export async function updateCategory(
  id: string,
  input: { name?: string; color?: string | null; isPerson?: boolean; personId?: string | null },
) {
  const patch: Record<string, unknown> = {}
  if (input.name !== undefined) patch.name = input.name.trim()
  if (input.color !== undefined) patch.color = input.color
  if (input.isPerson !== undefined) patch.is_person = input.isPerson
  if (input.personId !== undefined) patch.person_id = input.personId
  const { error } = await client().from('travel_categories').update(patch).eq('id', id)
  if (error) throw error
}

/**
 * Removes the category everywhere. Items keep existing with no category
 * (the foreign key is on delete set null) rather than vanishing from
 * every trip that ever used it — deleting a label should not delete
 * history.
 */
export async function deleteCategory(id: string) {
  const { error } = await client().from('travel_categories').delete().eq('id', id)
  if (error) throw error
}

/* ------------------------------------------------------------ items/notes */

export async function getItems(tripId: string): Promise<TravelItem[]> {
  const { data, error } = await client()
    .from('travel_items')
    .select('id, trip_id, category_id, text, packed, sort_order')
    .eq('trip_id', tripId)
    .order('sort_order', { ascending: true })
    .abortSignal(signal())
  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id as string,
    tripId: row.trip_id as string,
    categoryId: row.category_id as string | null,
    text: row.text as string,
    packed: row.packed as boolean,
    sortOrder: row.sort_order as number,
  }))
}

export async function addItems(
  tripId: string,
  items: { text: string; categoryId?: string | null }[],
) {
  if (items.length === 0) return

  const { error } = await client().from('travel_items').insert(
    items.map((item, index) => ({
      trip_id: tripId,
      category_id: item.categoryId ?? null,
      text: item.text.trim(),
      sort_order: index,
    })),
  )
  if (error) throw error
}

export async function updateItem(
  id: string,
  input: { text?: string; packed?: boolean; categoryId?: string | null },
) {
  const patch: Record<string, unknown> = {}
  if (input.text !== undefined) patch.text = input.text.trim()
  if (input.packed !== undefined) patch.packed = input.packed
  if (input.categoryId !== undefined) patch.category_id = input.categoryId

  const { error } = await client().from('travel_items').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteItem(id: string) {
  const { error } = await client().from('travel_items').delete().eq('id', id)
  if (error) throw error
}

/** Drops a whole section from one trip, leaving the category itself alone. */
export async function removeCategoryFromTrip(tripId: string, categoryId: string) {
  const { error } = await client()
    .from('travel_items')
    .delete()
    .eq('trip_id', tripId)
    .eq('category_id', categoryId)
  if (error) throw error
}

export async function getNotes(tripId: string): Promise<TravelNote[]> {
  const { data, error } = await client()
    .from('travel_notes')
    .select('id, trip_id, text, done, sort_order')
    .eq('trip_id', tripId)
    .order('sort_order', { ascending: true })
    .abortSignal(signal())
  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id as string,
    tripId: row.trip_id as string,
    text: row.text as string,
    done: row.done as boolean,
    sortOrder: row.sort_order as number,
  }))
}

export async function addNotes(tripId: string, texts: string[]) {
  if (texts.length === 0) return
  const { error } = await client().from('travel_notes').insert(
    texts.map((text, index) => ({ trip_id: tripId, text: text.trim(), sort_order: index })),
  )
  if (error) throw error
}

export async function updateNote(id: string, input: { text?: string; done?: boolean }) {
  const patch: Record<string, unknown> = {}
  if (input.text !== undefined) patch.text = input.text.trim()
  if (input.done !== undefined) patch.done = input.done
  const { error } = await client().from('travel_notes').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteNote(id: string) {
  const { error } = await client().from('travel_notes').delete().eq('id', id)
  if (error) throw error
}

/* ------------------------------------------------------- composed actions */

/**
 * Finds a category by name for this account, or creates it. Adding the
 * same recommended set twice should land in the one section rather than
 * making a second one with the same name.
 */
function findCategory(name: string, existing: TravelCategory[]): TravelCategory | undefined {
  const wanted = name.trim().toLowerCase()
  return existing.find((category) => category.name?.trim().toLowerCase() === wanted)
}

async function ensureCategory(
  name: string,
  color: string | null,
  existing: TravelCategory[],
): Promise<string> {
  const match = findCategory(name, existing)
  if (match) return match.id
  return createCategory({ name, color, sortOrder: existing.length })
}

/**
 * Copies a recommended set into a trip — the current one or the default
 * list, whichever id is passed. Items already in that trip's section are
 * not duplicated, so adding a set again tops it up with whatever is new
 * rather than doubling it.
 */
export async function addRecommendedSet(tripId: string, set: RecommendedSet) {
  const categories = await getCategories()
  const categoryId = await ensureCategory(set.name, set.color, categories)

  const existing = await getItems(tripId)
  const alreadyThere = new Set(
    existing
      .filter((item) => item.categoryId === categoryId)
      .map((item) => item.text.trim().toLowerCase()),
  )

  const missing = set.items.filter((text) => !alreadyThere.has(text.trim().toLowerCase()))
  await addItems(
    tripId,
    missing.map((text) => ({ text, categoryId })),
  )
}

/**
 * The account's default list, created on first use from the bundled
 * starter template. One per account — the unique index in migration 0011
 * enforces that, so a race cannot produce two.
 */
export async function ensureTemplateTrip(): Promise<string> {
  const trips = await getTrips()
  const existing = trips.find((trip) => trip.isTemplate)
  const tripId =
    existing?.id ?? (await createTrip({ name: 'Default list', isTemplate: true }))

  // Seed any starter section the template is missing entirely. Written
  // to be safe to re-run: an earlier version of this function threw
  // partway through and left templates holding only their first
  // section, and running it again is what repairs them.
  //
  // Only a wholly absent section comes back. Items deleted inside a
  // section that still has others stay deleted — the trade-off is that
  // emptying a starter section completely does let it return.
  const categories = await getCategories()
  const items = await getItems(tripId)

  for (const group of defaultTemplate.categories) {
    const match = findCategory(group.name, categories)
    if (match && items.some((item) => item.categoryId === match.id)) continue

    const categoryId =
      match?.id ??
      (await createCategory({
        name: group.name,
        color: group.color,
        sortOrder: categories.length,
      }))

    if (!match) {
      // Keep the local list in step so the next sort_order is right and
      // a repeated name is matched rather than duplicated.
      categories.push({
        id: categoryId,
        name: group.name,
        color: group.color,
        isPerson: false,
        personId: null,
        sortOrder: categories.length,
      })
    }

    await addItems(
      tripId,
      group.items.map((text) => ({ text, categoryId })),
    )
  }

  if ((await getNotes(tripId)).length === 0) {
    await addNotes(tripId, defaultTemplate.notes)
  }

  return tripId
}

/** Starts a trip from the default list: same sections, nothing packed. */
export async function createTripFromTemplate(input: {
  name: string
  startsOn?: string | null
  endsOn?: string | null
}): Promise<string> {
  const templateId = await ensureTemplateTrip()
  const tripId = await createTrip(input)

  const [items, notes] = await Promise.all([getItems(templateId), getNotes(templateId)])

  await addItems(
    tripId,
    items.map((item) => ({
      text: item.text,
      categoryId: item.categoryId,
    })),
  )
  await addNotes(tripId, notes.map((note) => note.text))

  return tripId
}

/* --------------------------------------------------------------- activity */

export interface TravelActivity {
  id: string
  kind:
    | 'item.added'
    | 'item.removed'
    | 'item.renamed'
    | 'note.added'
    | 'note.removed'
    | 'note.renamed'
  subject: string
  detail: string | null
  /** Who made the change, as they were named at the time. */
  actorLabel: string | null
  createdAt: string
}

/**
 * What has changed on a trip, newest first.
 *
 * Written by database triggers (migration 0016), not from here — there
 * is no corresponding write function on purpose, and the table grants
 * the client select only.
 */
export async function getActivity(tripId: string, limit = 100): Promise<TravelActivity[]> {
  const { data, error } = await client()
    .from('travel_activity')
    .select('id, kind, subject, detail, actor_label, created_at')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false })
    .limit(limit)
    .abortSignal(signal())
  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id as string,
    kind: row.kind as TravelActivity['kind'],
    subject: row.subject as string,
    detail: (row.detail as string | null) ?? null,
    actorLabel: (row.actor_label as string | null) ?? null,
    createdAt: row.created_at as string,
  }))
}

/* ---------------------------------------------------------------- sharing */

export interface SharedTrip {
  trip: { id: string; name: string; startsOn: string | null; endsOn: string | null }
  categories: TravelCategory[]
  items: TravelItem[]
  notes: TravelNote[]
}

/**
 * Sharing goes through database functions rather than ordinary queries:
 * row-level security can only see the signed-in user, and what grants
 * access here is a token in a URL. Each function re-checks the token and
 * resolves the trip from it, so a caller never names the trip.
 */
export async function enableShare(tripId: string): Promise<string> {
  const { data, error } = await client().rpc('travel_share_enable', { p_trip_id: tripId })
  if (error) throw error
  return data as string
}

export async function disableShare(tripId: string) {
  const { error } = await client().rpc('travel_share_disable', { p_trip_id: tripId })
  if (error) throw error
}

export async function getSharedTrip(token: string): Promise<SharedTrip> {
  const { data, error } = await client().rpc('travel_shared_get', { p_token: token })
  if (error) throw error
  return data as SharedTrip
}

export async function sharedSetItem(token: string, itemId: string, packed: boolean) {
  const { error } = await client().rpc('travel_shared_set_item', {
    p_token: token,
    p_item_id: itemId,
    p_packed: packed,
  })
  if (error) throw error
}

export async function sharedAddItem(token: string, categoryId: string | null, text: string) {
  const { error } = await client().rpc('travel_shared_add_item', {
    p_token: token,
    p_category_id: categoryId,
    p_text: text,
  })
  if (error) throw error
}

export async function sharedDeleteItem(token: string, itemId: string) {
  const { error } = await client().rpc('travel_shared_delete_item', {
    p_token: token,
    p_item_id: itemId,
  })
  if (error) throw error
}

export async function sharedSetNote(token: string, noteId: string, done: boolean) {
  const { error } = await client().rpc('travel_shared_set_note', {
    p_token: token,
    p_note_id: noteId,
    p_done: done,
  })
  if (error) throw error
}
