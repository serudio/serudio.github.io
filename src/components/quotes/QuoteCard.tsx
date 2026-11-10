import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { QUOTE_CATEGORIES } from '../../data/quoteCategories'
import type { Quote } from '../../data/quotes'

/**
 * One quote, as shown on the random page and on its own permalink.
 *
 * The text follows the site's language switcher rather than showing both
 * at once. English is optional on a quote, so Ukrainian is the fallback —
 * never the other way round, since every quote has Ukrainian by rule.
 */
export default function QuoteCard({ quote, compact = false }: { quote: Quote; compact?: boolean }) {
  const { t, i18n } = useTranslation()
  // resolvedLanguage, not language: the detector reports the browser's
  // full tag ("en-US"), which i18next resolves to "en" for lookups but
  // leaves untouched on `language` — comparing against that directly
  // silently falls through to Ukrainian for most English visitors.
  const text = i18n.resolvedLanguage === 'en' ? (quote.en ?? quote.uk) : quote.uk

  return (
    <Box>
      <Typography
        component="blockquote"
        variant={compact ? 'body1' : 'h6'}
        sx={{ m: 0, fontWeight: compact ? 400 : 500, lineHeight: 1.5 }}
      >
        {text}
      </Typography>

      {(quote.author || quote.source) && (
        <Typography
          component="figcaption"
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1.5 }}
        >
          {quote.author}
          {quote.author && quote.source ? ', ' : ''}
          {quote.source && <Box component="cite" sx={{ fontStyle: 'italic' }}>{quote.source}</Box>}
        </Typography>
      )}

      {!compact && quote.categories.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', rowGap: 1 }}>
          {quote.categories.map((slug) => {
            const category = QUOTE_CATEGORIES.find((item) => item.slug === slug)
            return (
              <Chip
                key={slug}
                size="small"
                variant="outlined"
                label={category ? t(category.nameKey) : slug}
              />
            )
          })}
        </Stack>
      )}
    </Box>
  )
}
