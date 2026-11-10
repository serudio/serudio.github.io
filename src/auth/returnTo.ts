/**
 * Google always redirects back to the site root, so the page that asked
 * for the sign-in is remembered here and restored once the session lands.
 * Kept out of AuthProvider.tsx so that file exports only a component
 * (react-refresh warns about mixed exports).
 */
const RETURN_TO_KEY = 'auth:returnTo'

export function rememberReturnTo(path: string) {
  try {
    sessionStorage.setItem(RETURN_TO_KEY, path)
  } catch {
    // Private mode: the visitor lands on the home page instead.
  }
}

/** Reads without consuming, so two callers don't fight over the redirect. */
export function peekReturnTo(): string | null {
  try {
    return sessionStorage.getItem(RETURN_TO_KEY)
  } catch {
    return null
  }
}

export function takeReturnTo(): string | null {
  const value = peekReturnTo()
  if (value) {
    try {
      sessionStorage.removeItem(RETURN_TO_KEY)
    } catch {
      // Nothing to clean up if storage is unavailable.
    }
  }
  return value
}
