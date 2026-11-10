import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export interface AuthState {
  session: Session | null
  /** True until the stored session has been read — guards flash a spinner. */
  loading: boolean
  email: string | null
  /** Signed in AND on the admin list. */
  isAdmin: boolean
  /** False when the site is built without Supabase credentials. */
  configured: boolean
  signIn: (returnTo?: string) => Promise<void>
  signOut: () => Promise<void>
}

/**
 * Kept in its own module so the provider file exports only a component —
 * react-refresh warns when a file mixes the two.
 */
export const AuthContext = createContext<AuthState | null>(null)
