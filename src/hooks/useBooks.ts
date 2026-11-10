import { useCallback, useEffect, useState } from "react";

import { fallbackBooks, type Book } from "../data/books";
import { isSupabaseConfigured } from "../lib/supabase";
import { getBooks, mapBookRow } from "../lib/books/db";

/**
 * The catalogue, with the bundled snapshot standing in whenever Supabase
 * cannot be reached — the free-tier project pauses after a week idle, and
 * a paused project never answers rather than failing fast.
 *
 * Reports `failed` rather than a message, so the caller can translate it.
 */
export function useBooks({ includeTrashed = false } = {}) {
  const [books, setBooks] = useState<Book[]>(fallbackBooks);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [failed, setFailed] = useState(false);
  const [live, setLive] = useState(false);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    setLoading(true);
    try {
      const { data, error } = await getBooks({ includeTrashed });
      if (error) {
        setFailed(true);
      } else if (data) {
        // Keep the previous list if the table came back empty for any
        // reason; an empty shelf is almost always a fault, not the truth.
        if (data.length > 0) setBooks(data.map(mapBookRow));
        setLive(true);
        setFailed(false);
      }
    } catch {
      // Timed out, offline, or the project is paused — the snapshot stands.
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [includeTrashed]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    books,
    loading,
    failed,
    refresh,
    usingFallback: !isSupabaseConfigured || !live,
  };
}
