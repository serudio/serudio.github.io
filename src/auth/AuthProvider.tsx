import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isAdminEmail } from '../config/auth'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { AuthContext, type AuthState } from './AuthContext'
import { rememberReturnTo } from './returnTo'

/**
 * Holds the one session for the whole site. Mounted above the router in
 * main.tsx, so every route — and every project living in this repo —
 * reads the same sign-in state.
 */

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) return

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (returnTo?: string) => {
    if (!supabase) throw new Error('Supabase is not configured')

    rememberReturnTo(returnTo ?? window.location.pathname)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut()
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      session,
      loading,
      email: session?.user.email ?? null,
      isAdmin: isAdminEmail(session?.user.email),
      configured: isSupabaseConfigured,
      signIn,
      signOut,
    }),
    [session, loading, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
