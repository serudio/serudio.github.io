/**
 * How often each home-page link gets opened, so the most-used ones can
 * be offered as shortcuts.
 *
 * Deliberately behind a tiny interface. Today the counts live in this
 * browser's localStorage, which means they do not follow the visitor
 * between devices and are lost when site data is cleared — acceptable
 * for a convenience shortcut. When there is shared auth across the site,
 * a Supabase-backed store implementing the same two methods drops in
 * here without touching any caller; signed-out visitors keep the local
 * one as the fallback.
 */

export interface UsageEntry {
  id: string
  count: number
  /** Epoch ms, used to break ties so a recent click outranks a stale one. */
  lastAt: number
}

export interface UsageStore {
  record(id: string): void
  top(limit: number): UsageEntry[]
}

const STORAGE_KEY = 'serudio_usage'

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
  record(id) {
    const entries = read()
    const previous = entries[id]
    entries[id] = {
      id,
      count: (previous?.count ?? 0) + 1,
      lastAt: Date.now(),
    }
    write(entries)
  },

  top(limit) {
    return Object.values(read()).sort(byUsefulness).slice(0, limit)
  },
}
