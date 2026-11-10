import { createContext, useContext, useEffect } from 'react'
import type { Breakpoint } from '@mui/material/styles'

/**
 * What a page tells the header about itself.
 *
 * The header used to sit in a row of its own, fixed at the narrowest
 * width, above a page that then drew its own "back" link in a second
 * row. Two rows of furniture before any content, and on a wide page a
 * header indented well inside it. A page now hands its back link to the
 * header and says how wide it is, so both lines become one that lines
 * up with the content beneath.
 *
 * Kept out of the provider component's file so that file exports only a
 * component (react-refresh warns about mixed exports) — the same split
 * as auth/returnTo.ts.
 */
export interface BackLink {
  to: string
  label: string
}

export interface PageChrome {
  back: BackLink | null
  /** Matches the page's own Container, so the header lines up with it. */
  width: Breakpoint
}

export const DEFAULT_CHROME: PageChrome = { back: null, width: 'sm' }

export const PageChromeContext = createContext<PageChrome>(DEFAULT_CHROME)
export const SetPageChromeContext = createContext<(chrome: PageChrome) => void>(
  () => {},
)

export function usePageChrome(): PageChrome {
  return useContext(PageChromeContext)
}

/**
 * Declares a page's chrome for as long as it is mounted.
 *
 * Takes the fields apart rather than an object so the effect can depend
 * on values instead of on a literal that is new on every render.
 */
export function useDeclarePageChrome(options: {
  backTo?: string
  backLabel?: string
  width?: Breakpoint
}) {
  const { backTo, backLabel, width = 'sm' } = options
  const setChrome = useContext(SetPageChromeContext)

  useEffect(() => {
    setChrome({
      back: backTo && backLabel ? { to: backTo, label: backLabel } : null,
      width,
    })
    // Leaving the page takes its chrome with it, so a page that
    // declares none is never left wearing the last one's.
    return () => setChrome(DEFAULT_CHROME)
  }, [backTo, backLabel, width, setChrome])
}
