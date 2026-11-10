import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Seo from '../../components/Seo'
import Footer from '../../components/Footer'
import QuoteCard from '../../components/quotes/QuoteCard'
import { RESTRICTED_SLUGS } from '../../data/quoteCategories'
import { useQuotes } from '../../hooks/useQuotes'
import { useDeclarePageChrome } from '../../components/pageChrome'

/**
 * A single quote's permalink.
 *
 * This page exists so a quote can be linked to and show a correct
 * preview when the link is pasted somewhere — not as a search landing
 * page. Quotes carrying a restricted category are marked noindex, and
 * none of these URLs are in the sitemap (see
 * scripts/generate-seo-files.ts for why).
 */
export default function QuotePage() {
  const { t } = useTranslation()

  useDeclarePageChrome({ backTo: '/quotes', backLabel: t('quotes.allQuotes') })
  const { slug } = useParams<{ slug: string }>()
  const { quotes, loading } = useQuotes()

  const quote = useMemo(() => quotes.find((item) => item.slug === slug), [quotes, slug])

  const restricted = quote?.categories.some((item) => RESTRICTED_SLUGS.includes(item)) ?? false

  // The quote itself is the description — it is the whole point of the
  // page, and it is what a link preview should show.
  const description = quote ? `${quote.uk}${quote.author ? ` — ${quote.author}` : ''}` : ''

  return (
    <Container maxWidth="sm" disableGutters>
      <Seo
        title={quote ? t('quotes.title') : t('quotes.notFoundTitle')}
        description={description || t('quotes.seoDescription')}
        path={`/quotes/${slug ?? ''}`}
        noIndex={restricted || !quote}
      />
      <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 } }}>
        {quote ? (
          <Box component="figure" sx={{ m: 0 }}>
            <QuoteCard quote={quote} />
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {loading ? t('quotes.loading') : t('quotes.notFound')}
          </Typography>
        )}

        <Footer />
      </Paper>
    </Container>
  )
}
