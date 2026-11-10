/**
 * Who may administer which project.
 *
 * Mirrors public.is_admin() in the Supabase migrations — the database is
 * what actually enforces this; the copy here only shapes the UI. Changing
 * an address means changing it in both places.
 */
export const ADMIN_EMAILS = ['cestserg@gmail.com'] as const

export function isAdminEmail(email: string | undefined | null) {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase() as (typeof ADMIN_EMAILS)[number])
}

/** Where a visitor is sent to sign in, and back to afterwards. */
export const SIGN_IN_PATH = '/signin'
