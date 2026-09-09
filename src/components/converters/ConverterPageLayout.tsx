import type { ReactNode } from 'react'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import { Link as RouterLink } from 'react-router-dom'
import Seo from '../Seo'
import AdSlot from '../AdSlot'

interface ConverterPageLayoutProps {
  title: string
  seoDescription: string
  /** Full route path, e.g. '/converters/fuel-consumption'. */
  path: string
  /** AdSense ad unit slot id for this converter page (see AdSlot.tsx). */
  adSlotId?: string
  children: ReactNode
}

/**
 * Shared chrome for every converter page: SEO tags, a back link to the
 * index, the page's single <h1>, and an ad slot. New converter pages
 * should use this rather than rebuilding the layout, so the SEO/AdSense
 * story stays consistent as the list grows. See CLAUDE.md, section "SEO".
 */
export default function ConverterPageLayout({
  title,
  seoDescription,
  path,
  adSlotId = 'TODO-REPLACE-WITH-REAL-AD-SLOT-ID',
  children,
}: ConverterPageLayoutProps) {
  return (
    <Container maxWidth="sm" disableGutters>
      <Seo title={title} description={seoDescription} path={path} />
      <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 5 }}>
        <Link
          component={RouterLink}
          to="/converters"
          variant="body2"
          color="text.secondary"
          sx={{ display: 'inline-block', mb: 2 }}
        >
          &larr; Усі конвертери
        </Link>
        <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
          {title}
        </Typography>
        {children}
        <AdSlot slotId={adSlotId} />
      </Paper>
    </Container>
  )
}
