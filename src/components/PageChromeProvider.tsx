import { useMemo, useState, type ReactNode } from 'react'
import {
  DEFAULT_CHROME,
  PageChromeContext,
  SetPageChromeContext,
  type PageChrome,
} from './pageChrome'

/**
 * Holds what the current page told the header about itself. Two
 * contexts rather than one: pages only set, the header only reads, and
 * splitting them keeps a page's declaration from re-rendering every
 * other reader.
 */
export default function PageChromeProvider({ children }: { children: ReactNode }) {
  const [chrome, setChrome] = useState<PageChrome>(DEFAULT_CHROME)

  // setState is stable, so the setter context never changes identity and
  // the effect in useDeclarePageChrome does not re-run on every render.
  const value = useMemo(() => chrome, [chrome])

  return (
    <SetPageChromeContext.Provider value={setChrome}>
      <PageChromeContext.Provider value={value}>{children}</PageChromeContext.Provider>
    </SetPageChromeContext.Provider>
  )
}
