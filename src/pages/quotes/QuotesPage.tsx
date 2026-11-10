import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams, Link as RouterLink } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import Seo from '../../components/Seo'
import Footer from '../../components/Footer'
import QuoteCard from '../../components/quotes/QuoteCard'
import CategoryFilter from '../../components/quotes/CategoryFilter'
import { CATEGORY_SLUGS } from '../../data/quoteCategories'
import { useQuotes } from '../../hooks/useQuotes'
import {
  filterQuotes,
  formatCategoryParam,
  parseCategoryParam,
  pickRandom,
} from '../../lib/quotes/select'

/**
 * One random quote, and a new one on every refresh.
 *
 * The whole list is fetched once and the pick happens here, so "another
 * one" is instant rather than a round trip — the table is small enough
 * that this is cheaper than asking the database each time.
 *
 * The selected categories live in the URL (/quotes?c=humor,love) so a
 * filtered view can be shared or bookmarked.
 */
export default function QuotesPage() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { quotes, loading } = useQuotes()

  const selected = useMemo(
    () => parseCategoryParam(searchParams.get('c'), CATEGORY_SLUGS),
    [searchParams],
  )

  const visible = useMemo(() => filterQuotes(quotes, selected), [quotes, selected])
  const [currentId, setCurrentId] = useState<string | null>(null)

  const current = useMemo(
    () => visible.find((quote) => quote.id === currentId) ?? null,
    [visible, currentId],
  )

  const shuffle = useCallback(() => {
    setCurrentId(pickRandom(visible, currentId ?? undefined)?.id ?? null)
  }, [visible, currentId])

  // Pick on first load, and again whenever the filter leaves the current
  // quote out of the set.
  useEffect(() => {
    if (visible.length === 0) {
      setCurrentId(null)
      return
    }
    if (!visible.some((quote) => quote.id === currentId)) {
      setCurrentId(pickRandom(visible)?.id ?? null)
    }
  }, [visible, currentId])

  const handleCategories = (next: string[]) => {
    const value = formatCategoryParam(next)
    setSearchParams(value ? { c: value } : {}, { replace: true })
  }

  return (
    <Container maxWidth="sm" disableGutters>
      <Seo title={t('quotes.title')} description={t('quotes.seoDescription')} path="/quotes" />
      <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 } }}>
        <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
          {t('quotes.title')}
        </Typography>

        <Box sx={{ mb: 3 }}>
          <CategoryFilter selected={selected} onChange={handleCategories} />
        </Box>

        <Box
          sx={{
            minHeight: 160,
            display: 'flex',
            alignItems: 'center',
            py: 3,
            borderTop: '1px dashed',
            borderBottom: '1px dashed',
            borderColor: 'divider',
          }}
        >
          {current ? (
            <Box sx={{ width: '100%' }}>
              <QuoteCard quote={current} />
              <Link
                component={RouterLink}
                to={`/quotes/${current.slug}`}
                variant="body2"
                color="text.secondary"
                sx={{ display: 'inline-block', mt: 2 }}
              >
                {t('quotes.permalink')}
              </Link>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {loading ? t('quotes.loading') : t('quotes.noneMatch')}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button
            variant="contained"
            startIcon={<AutorenewIcon />}
            onClick={shuffle}
            disabled={visible.length < 2}
          >
            {t('quotes.another')}
          </Button>
        </Box>

        {selected.length > 0 && visible.length === 0 && (
          <Alert severity="info" sx={{ mt: 3 }}>
            {t('quotes.noneMatchHint')}
          </Alert>
        )}

        <Footer />
      </Paper>
    </Container>
  )
}
