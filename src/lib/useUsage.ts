import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import { localUsageStore, remoteUsageStore, type UsageEntry } from './usage'

/**
 * The most-used entries in a scope, and a way to add to them.
 *
 * Picks the store from whether anyone is signed in, so a caller never
 * has to know which one it is talking to. Signing in switches stores
 * rather than merging them: the local counts are this browser's guesses
 * and the account's are the real record, and silently uploading one
 * browser's history into an account is a surprise nobody asked for.
 */
export function useUsage(scope: string, limit: number) {
  const { session } = useAuth()
  const store = session ? remoteUsageStore : localUsageStore
  const [top, setTop] = useState<UsageEntry[]>([])

  const refresh = useCallback(() => {
    let live = true
    void store.top(scope, limit).then((entries) => {
      if (live) setTop(entries)
    })
    return () => {
      live = false
    }
  }, [store, scope, limit])

  useEffect(refresh, [refresh])

  const record = useCallback(
    (id: string) => {
      store.record(scope, id)
      // The remote store has already been told; re-reading it would
      // race the write. Update what is on screen instead.
      setTop((previous) => {
        const found = previous.find((entry) => entry.id === id)
        const next = found
          ? previous.map((entry) =>
              entry.id === id
                ? { ...entry, count: entry.count + 1, lastAt: Date.now() }
                : entry,
            )
          : [...previous, { id, count: 1, lastAt: Date.now() }]
        return next
          .sort((a, b) => b.count - a.count || b.lastAt - a.lastAt)
          .slice(0, limit)
      })
    },
    [store, scope, limit],
  )

  return { top, record }
}
