import type { Quote } from '../../data/quotes'
import { supabase } from '../supabase'

export type QuoteRow = {
  id: string
  slug: string
  text_uk: string
  text_en: string | null
  author: string | null
  source: string | null
  categories: string[] | null
  published: boolean
  sort_order: number
  deleted_at: string | null
}

const columns =
  'id, slug, text_uk, text_en, author, source, categories, published, sort_order, deleted_at'

export function mapQuoteRow(row: QuoteRow): Quote {
  return {
    id: row.id,
    slug: row.slug,
    uk: row.text_uk,
    en: row.text_en ?? undefined,
    author: row.author ?? undefined,
    source: row.source ?? undefined,
    categories: row.categories ?? [],
  }
}

/** The shape the admin form edits; the rest is managed by the database. */
export interface QuoteInput {
  slug: string
  uk: string
  en?: string
  author?: string
  source?: string
  categories: string[]
  published: boolean
  sortOrder?: number
}

function toRow(quote: QuoteInput) {
  return {
    slug: quote.slug.trim(),
    text_uk: quote.uk.trim(),
    text_en: quote.en?.trim() || null,
    author: quote.author?.trim() || null,
    source: quote.source?.trim() || null,
    categories: quote.categories,
    published: quote.published,
    sort_order: quote.sortOrder ?? 0,
  }
}

/** A paused Supabase project never answers, so every read gets a deadline. */
const REQUEST_TIMEOUT_MS = 8000

function client() {
  if (!supabase) throw new Error('Supabase is not configured')
  return supabase
}

/**
 * Drafts and trashed quotes are hidden by row-level security for everyone
 * but the admin; these filters keep them out of the admin's own public
 * preview too.
 */
export async function getQuotes({ includeUnpublished = false, includeTrashed = false } = {}) {
  let query = client().from('quotes').select(columns)

  if (!includeTrashed) query = query.is('deleted_at', null)
  if (!includeUnpublished) query = query.eq('published', true)

  return query
    .order('sort_order', { ascending: true })
    .abortSignal(AbortSignal.timeout(REQUEST_TIMEOUT_MS))
    .returns<QuoteRow[]>()
}

export async function createQuote(quote: QuoteInput) {
  const { error } = await client().from('quotes').insert(toRow(quote))
  if (error) throw error
}

export async function updateQuote(id: string, quote: QuoteInput) {
  const { error } = await client().from('quotes').update(toRow(quote)).eq('id', id)
  if (error) throw error
}

/** Moves a quote to the trash; the row stays, hidden from the public page. */
export async function trashQuote(id: string) {
  const { error } = await client()
    .from('quotes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function restoreQuote(id: string) {
  const { error } = await client().from('quotes').update({ deleted_at: null }).eq('id', id)
  if (error) throw error
}

/** Permanent — the row is gone for good. */
export async function deleteQuote(id: string) {
  const { error } = await client().from('quotes').delete().eq('id', id)
  if (error) throw error
}
