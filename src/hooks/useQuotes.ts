import { useCallback, useEffect, useState } from 'react'

import { fallbackQuotes, type Quote } from '../data/quotes'
import { isSupabaseConfigured } from '../lib/supabase'
import { getQuotes, mapQuoteRow } from '../lib/quotes/db'

/**
 * The quotes, with the bundled list standing in whenever Supabase cannot
 * be reached — the free-tier project pauses after a week idle and then
 * never answers rather than failing fast. Same arrangement as useBooks.
 *
 * This is why /quotes works at all before the database is configured.
 */
export function useQuotes({ includeUnpublished = false, includeTrashed = false } = {}) {
  const [quotes, setQuotes] = useState<Quote[]>(fallbackQuotes)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [failed, setFailed] = useState(false)
  const [live, setLive] = useState(false)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) return

    setLoading(true)
    try {
      const { data, error } = await getQuotes({ includeUnpublished, includeTrashed })
      if (error) {
        setFailed(true)
      } else if (data) {
        // An empty table is almost always a fault rather than the truth,
        // so the bundled list stands in that case too.
        if (data.length > 0) setQuotes(data.map(mapQuoteRow))
        setLive(true)
        setFailed(false)
      }
    } catch {
      // Timed out, offline, or the project is paused — the snapshot stands.
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [includeUnpublished, includeTrashed])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    quotes,
    loading,
    failed,
    refresh,
    usingFallback: !isSupabaseConfigured || !live,
  }
}
