import { createClient } from '@supabase/supabase-js'

/**
 * One client for the whole site.
 *
 * Supabase keeps its session in localStorage under a key derived from the
 * project ref, so every page on this origin shares the same sign-in
 * automatically — that is what makes auth work across projects here
 * without any extra plumbing. Keep it to a single client: a second one
 * would race this one when refreshing tokens.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null
