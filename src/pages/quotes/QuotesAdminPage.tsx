import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import Seo from '../../components/Seo'
import CategoryFilter from '../../components/quotes/CategoryFilter'
import QuoteFormDialog from '../../components/quotes/QuoteFormDialog'
import { QUOTE_CATEGORIES } from '../../data/quoteCategories'
import type { Quote } from '../../data/quotes'
import { useQuotes } from '../../hooks/useQuotes'
import { createQuote, trashQuote, updateQuote, type QuoteInput } from '../../lib/quotes/db'

/**
 * Manage every quote — including drafts and demotivational ones, which
 * the public page never shows. Reachable only through <RequireAuth admin>;
 * the database enforces the same rule independently (see migration 0009).
 */
export default function QuotesAdminPage() {
  const { t } = useTranslation()
  const { quotes, loading, failed, refresh, usingFallback } = useQuotes({
    includeUnpublished: true,
  })

  const [selected, setSelected] = useState<string[]>([])
  const [editing, setEditing] = useState<Quote | null>(null)
  const [open, setOpen] = useState(false)

  // The admin view shows everything; the category chips narrow it down
  // rather than applying the public page's restricted-category rule.
  const visible = useMemo(
    () =>
      selected.length === 0
        ? quotes
        : quotes.filter((quote) => quote.categories.some((slug) => selected.includes(slug))),
    [quotes, selected],
  )

  const handleSave = async (input: QuoteInput) => {
    if (editing) await updateQuote(editing.id, input)
    else await createQuote(input)
    await refresh()
  }

  const handleTrash = async (quote: Quote) => {
    await trashQuote(quote.id)
    await refresh()
  }

  return (
    <Container maxWidth="lg" disableGutters>
      <Seo title={t('quotesAdmin.title')} path="/quotes/admin" noIndex />
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack
          direction="row"
          sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2 }}
        >
          <Typography variant="h6" component="h1">
            {t('quotesAdmin.title')}
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
          >
            {t('quotesAdmin.add')}
          </Button>
        </Stack>

        {usingFallback && <Alert severity="warning" sx={{ mb: 2 }}>{t('quotesAdmin.offline')}</Alert>}
        {failed && <Alert severity="error" sx={{ mb: 2 }}>{t('quotesAdmin.loadFailed')}</Alert>}

        <Box sx={{ mb: 2 }}>
          <CategoryFilter selected={selected} onChange={setSelected} />
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {t('quotesAdmin.count', { shown: visible.length, total: quotes.length })}
        </Typography>

        <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('quotesAdmin.textUk')}</TableCell>
                <TableCell>{t('quotesAdmin.author')}</TableCell>
                <TableCell>{t('quotesAdmin.categories')}</TableCell>
                <TableCell align="right">{t('quotesAdmin.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((quote) => (
                <TableRow key={quote.id} hover>
                  <TableCell sx={{ maxWidth: 420 }}>
                    <Typography variant="body2" noWrap title={quote.uk}>
                      {quote.uk}
                    </Typography>
                    {!quote.en && (
                      <Typography variant="caption" color="warning.main">
                        {t('quotesAdmin.missingEn')}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{quote.author ?? '—'}</TableCell>
                  <TableCell>
                    <Stack direction="row" useFlexGap flexWrap="wrap" spacing={0.5}>
                      {quote.categories.map((slug) => {
                        const category = QUOTE_CATEGORIES.find((item) => item.slug === slug)
                        return (
                          <Chip
                            key={slug}
                            size="small"
                            variant="outlined"
                            color={category?.restricted ? 'warning' : 'default'}
                            label={category ? t(category.nameKey) : slug}
                          />
                        )
                      })}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={t('quotesAdmin.edit')}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditing(quote)
                          setOpen(true)
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('quotesAdmin.trash')}>
                      <IconButton size="small" onClick={() => void handleTrash(quote)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && visible.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant="body2" color="text.secondary">
                      {t('quotesAdmin.empty')}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <QuoteFormDialog
        open={open}
        quote={editing}
        onClose={() => setOpen(false)}
        onSave={handleSave}
      />
    </Container>
  )
}
