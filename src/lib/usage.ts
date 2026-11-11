/**
 * How often something gets used, so the most-used ones can be offered
 * as shortcuts.
 *
 * Two stores behind one interface. Signed out, the counts live in this
 * browser's localStorage: they do not follow the visitor between
 * devices and go when site data is cleared, which is acceptable for a
 * convenience shortcut. Signed in, they live in usage_counters
 * (migration 0018) and follow the account.
 *
 * `scope` keeps unrelated counters apart — the home page's links and
 * the fuel calculator's figures are both "most used" and have nothing
 * to say to each other.
 *
 * `top` is async because the remote store cannot be anything else. The
 * local one resolves immediately rather than pretending to be slow.
 */

import { supabase } from './supabase'

export interface UsageEntry {
  id: string
  count: number
  /** Epoch ms, used to break ties so a recent click outranks a stale one. */
  lastAt: number
}

export interface UsageStore {
  record(scope: string, id: string): void
  top(scope: string, limit: number): Promise<UsageEntry[]>
}

/** Namespaces for `scope`, so a typo cannot silently split a counter. */
export const USAGE_HOME = 'home'
export const USAGE_FUEL = 'fuel'

const STORAGE_KEY = 'serudio_usage'

/**
 * Entries were stored unscoped before there was more than one counter.
 * They are read as the home page's, which is the only thing that was
 * ever counted, so existing shortcuts survive.
 */
function scopedKey(scope: string, id: string): string {
  return scope === USAGE_HOME ? id : `${scope}:${id}`
}

function inScope(scope: string, id: string): string | null {
  if (scope === USAGE_HOME) return id.includes(':') ? null : id
  return id.startsWith(`${scope}:`) ? id.slice(scope.length + 1) : null
}

/**
 * A link clicked once years ago should not outrank one clicked twice
 * yesterday forever, so ties fall back to recency rather than
 * accumulating a permanent lead.
 */
function byUsefulness(a: UsageEntry, b: UsageEntry): number {
  return b.count - a.count || b.lastAt - a.lastAt
}

function read(): Record<string, UsageEntry> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as Record<string, unknown>
    const entries: Record<string, UsageEntry> = {}

    // Hand-edited or half-written storage should degrade to "no history"
    // for the bad rows rather than throwing the whole section away.
    for (const [id, value] of Object.entries(parsed)) {
      if (!value || typeof value !== 'object') continue
      const { count, lastAt } = value as Partial<UsageEntry>
      if (typeof count === 'number' && count > 0) {
        entries[id] = { id, count, lastAt: typeof lastAt === 'number' ? lastAt : 0 }
      }
    }
    return entries
  } catch {
    // Private browsing, blocked storage, or unparseable JSON.
    return {}
  }
}

function write(entries: Record<string, UsageEntry>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Nothing useful to do; the shortcuts just will not build up.
  }
}

export const localUsageStore: UsageStore = {
  record(scope, id) {
    const key = scopedKey(scope, id)
    const entries = read()
    entries[key] = {
      id: key,
      count: (entries[key]?.count ?? 0) + 1,
      lastAt: Date.now(),
    }
    write(entries)
  },

  top(scope, limit) {
    const entries = Object.values(read())
      .map((entry) => ({ entry, id: inScope(scope, entry.id) }))
      .filter((row): row is { entry: UsageEntry; id: string } => row.id !== null)
      .map(({ entry, id }) => ({ ...entry, id }))
      .sort(byUsefulness)
      .slice(0, limit)
    return Promise.resolve(entries)
  },
}

/**
 * The signed-in store. Counts live in usage_counters and follow the
 * account between devices.
 *
 * Recording is fire-and-forget: a shortcut that fails to get more
 * popular is not worth interrupting anyone over, and the caller is
 * usually mid-click on something else.
 */
export const remoteUsageStore: UsageStore = {
  record(scope, id) {
    void supabase?.rpc('usage_record', { p_scope: scope, p_key: id })
  },

  async top(scope, limit) {
    // A caller that only wants `record` asks for none; PostgREST has no
    // sensible answer for limit 0, so do not ask it.
    if (!supabase || limit <= 0) return []
    const { data, error } = await supabase
      .from('usage_counters')
      .select('key, count, last_at')
      .eq('scope', scope)
      .order('count', { ascending: false })
      .order('last_at', { ascending: false })
      .limit(limit)
    if (error) return []

    return (data ?? []).map((row) => ({
      id: row.key as string,
      count: row.count as number,
      lastAt: new Date(row.last_at as string).getTime(),
    }))
  },
}
