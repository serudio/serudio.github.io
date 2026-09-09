import { useEffect, useRef } from 'react'
import Box from '@mui/material/Box'
import { ADSENSE_CLIENT_ID } from '../config/site'

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

interface AdSlotProps {
  /** The ad unit's slot id from the AdSense dashboard (Ads -> By ad unit). */
  slotId: string
  format?: string
  fullWidthResponsive?: boolean
}

/**
 * Renders one Google AdSense ad unit.
 *
 * AdSense requires a real slot id per placement. Until a real id is set,
 * this deliberately skips pushing to window.adsbygoogle so we never send
 * Google an invalid/placeholder unit (that can trigger policy warnings on
 * the account) — it just renders an empty, invisible <ins>.
 *
 * To add a real ad: create the ad unit in the AdSense dashboard, then use
 * <AdSlot slotId="..." /> here — don't hand-roll another <ins
 * class="adsbygoogle"> element elsewhere. Watch ad density/placement:
 * both AdSense policy (ads must not be mistaken for navigation/content)
 * and SEO (Core Web Vitals / layout shift) depend on it. See CLAUDE.md,
 * section "AdSense".
 */
export default function AdSlot({ slotId, format = 'auto', fullWidthResponsive = true }: AdSlotProps) {
  const pushed = useRef(false)

  useEffect(() => {
    if (pushed.current) return
    if (!slotId || slotId.startsWith('TODO')) return // placeholder guard
    try {
      ;(window.adsbygoogle = window.adsbygoogle ?? []).push({})
      pushed.current = true
    } catch {
      // AdSense script blocked (ad blocker) or not loaded yet — fail silently.
    }
  }, [slotId])

  return (
    <Box sx={{ my: 3, textAlign: 'center' }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
      />
    </Box>
  )
}
