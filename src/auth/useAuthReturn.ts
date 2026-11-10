import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { takeReturnTo } from './returnTo'
import { useAuth } from './useAuth'

/**
 * Mounted once in App. When a session appears after the OAuth round trip,
 * sends the visitor back to the page that asked them to sign in.
 */
export function useAuthReturn() {
  const { session } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!session) return

    const target = takeReturnTo()
    if (target && target !== window.location.pathname) {
      navigate(target, { replace: true })
    }
  }, [session, navigate])
}
