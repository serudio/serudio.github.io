import { useTranslation } from 'react-i18next'
import Chip from '@mui/material/Chip'
import { Link as RouterLink } from 'react-router-dom'
import type { HomeLink } from '../../data/homeLinks'

/**
 * One home-page destination as a chip.
 *
 * Internal links go through the router so they do not reload the app;
 * external ones open in a new tab and carry the usual rel for that.
 * That difference is deliberately invisible — every chip renders the
 * same, so the grid reads as one list rather than two kinds of thing.
 * Either way the click is recorded first, which feeds the "most used"
 * row.
 */
export default function LinkChip({
  link,
  onOpen,
}: {
  link: HomeLink
  onOpen: (id: string) => void
}) {
  const { t } = useTranslation()
  const label = t(link.labelKey)

  const shared = {
    label,
    size: 'small' as const,
    clickable: true,
    onClick: () => onOpen(link.id),
    sx: {
      maxWidth: '100%',
      // Lowercase with wide tracking: set in px rather than em so the
      // spacing stays put regardless of the chip's font size.
      '& .MuiChip-label': { textTransform: 'lowercase', letterSpacing: '1.25px' },
    },
  }

  if (link.to) {
    return <Chip {...shared} component={RouterLink} to={link.to} />
  }

  return (
    <Chip
      {...shared}
      component="a"
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
    />
  )
}
