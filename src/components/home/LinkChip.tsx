import { useTranslation } from 'react-i18next'
import Chip from '@mui/material/Chip'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Link as RouterLink } from 'react-router-dom'
import type { HomeLink } from '../../data/homeLinks'

/**
 * One home-page destination as a chip.
 *
 * Internal links go through the router so they do not reload the app;
 * external ones open in a new tab and carry the usual rel for that.
 * Either way the click is recorded first, which is what feeds the
 * "most used" row.
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
    sx: { maxWidth: '100%' },
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
      icon={<OpenInNewIcon />}
    />
  )
}
