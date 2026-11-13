import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/useAuth'
import {
  localUsageStore,
  mergeLocalIntoAccount,
  remoteUsageStore,
  type UsageEntry,
} from './usage'

/**
 * The most-used entries in a scope, and a way to add to them.
 *
 * Picks the store from whether anyone is signed in, so a caller never
 * has to know which one it is talking to.
 *
 * NOTHING IS READ UNTIL AUTH HAS SETTLED. The session is restored from
 * localStorage a moment after the first render, so a hook that read
 * straight away would build its list from the signed-out store and then
 * throw it away when the session arrived — which is exactly what the
 * home page did: the shortcuts appeared and vanished a second later.
 *
 * On the first signed-in load in a browser, that browser's counts are
 * folded into the account. The earlier design switched stores and
 * dropped them, on the reasoning that uploading a browser's history
 * into an account is a surprise; the effect was that anyone signed in
 * had no shortcuts at all until they clicked their way back to a dozen.
 * It is the same person's own history going into their own account.
 */

const MERGED_KEY = 'serudio_usage_merged'

/** In flight, so two hooks mounting together merge once between them. */
let merging: Promise<void> | null = null

function alreadyMerged(): boolean {
  try {
    return localStorage.getItem(MERGED_KEY) === '1'
  } catch {
    // Storage blocked: there is nothing local worth carrying over, and
    // nothing to remember having done it with.
    return true
  }
}

function markMerged(): void {
  try {
    localStorage.setItem(MERGED_KEY, '1')
  } catch {
    // Nothing useful to do; the worst case is merging again next time.
  }
}

function ensureMerged(): Promise<void> {
  if (alreadyMerged()) return Promise.resolve()

  merging ??= mergeLocalIntoAccount()
    .then(markMerged)
    // A failed merge leaves the flag unset so a later visit retries,
    // rather than losing the counts for good.
    .catch(() => {})
    .finally(() => {
      merging = null
    })

  return merging
}

export function useUsage(scope: string, limit: number) {
  const { session, loading } = useAuth()
  const store = session ? remoteUsageStore : localUsageStore
  const [top, setTop] = useState<UsageEntry[]>([])

  const refresh = useCallback(() => {
    let live = true

    if (!loading) {
      void (session ? ensureMerged() : Promise.resolve())
        .then(() => store.top(scope, limit))
        .then((entries) => {
          if (live) setTop(entries)
        })
    }

    return () => {
      live = false
    }
  }, [store, scope, limit, loading, session])

  useEffect(refresh, [refresh])

  const record = useCallback(
    (id: string) => {
      store.record(scope, id)
      // The store has already been told; re-reading it would race the
      // write. Update what is on screen instead.
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
