import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import { QUOTE_CATEGORIES } from '../../data/quoteCategories'
import type { Quote } from '../../data/quotes'
import type { QuoteInput } from '../../lib/quotes/db'
import { slugifyQuote } from '../../lib/quotes/slug'

const EMPTY: QuoteInput = {
  slug: '',
  uk: '',
  en: '',
  author: '',
  source: '',
  categories: [],
  published: true,
}

/**
 * Add or edit one quote.
 *
 * The slug is suggested from the Ukrainian text but stays editable, and
 * is never re-suggested once a quote exists — changing it would break a
 * link someone has already shared.
 */
export default function QuoteFormDialog({
  open,
  quote,
  onClose,
  onSave,
}: {
  open: boolean
  quote: Quote | null
  onClose: () => void
  onSave: (input: QuoteInput) => Promise<void>
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState<QuoteInput>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setForm(
      quote
        ? {
            slug: quote.slug,
            uk: quote.uk,
            en: quote.en ?? '',
            author: quote.author ?? '',
            source: quote.source ?? '',
            categories: quote.categories,
            published: true,
          }
        : EMPTY,
    )
  }, [open, quote])

  const set = <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }))

  const handleUk = (value: string) => {
    setForm((previous) => ({
      ...previous,
      uk: value,
      // Only auto-fill the slug for a new quote whose slug is untouched.
      slug: !quote && (previous.slug === '' || previous.slug === slugifyQuote(previous.uk))
        ? slugifyQuote(value)
        : previous.slug,
    }))
  }

  const toggleCategory = (slug: string) =>
    set(
      'categories',
      form.categories.includes(slug)
        ? form.categories.filter((item) => item !== slug)
        : [...form.categories, slug],
    )

  const valid = form.uk.trim().length > 0 && form.slug.trim().length > 0

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await onSave(form)
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{quote ? t('quotesAdmin.editTitle') : t('quotesAdmin.addTitle')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label={t('quotesAdmin.textUk')}
            value={form.uk}
            onChange={(event) => handleUk(event.target.value)}
            helperText={t('quotesAdmin.textUkHelp')}
            multiline
            minRows={2}
            required
            fullWidth
          />
          <TextField
            label={t('quotesAdmin.textEn')}
            value={form.en}
            onChange={(event) => set('en', event.target.value)}
            multiline
            minRows={2}
            fullWidth
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label={t('quotesAdmin.author')}
              value={form.author}
              onChange={(event) => set('author', event.target.value)}
              fullWidth
            />
            <TextField
              label={t('quotesAdmin.source')}
              value={form.source}
              onChange={(event) => set('source', event.target.value)}
              fullWidth
            />
          </Stack>
          <TextField
            label={t('quotesAdmin.slug')}
            value={form.slug}
            onChange={(event) => set('slug', event.target.value)}
            helperText={t('quotesAdmin.slugHelp')}
            fullWidth
          />

          <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1} sx={{ rowGap: 1 }}>
            {QUOTE_CATEGORIES.map((category) => (
              <Chip
                key={category.slug}
                label={t(category.nameKey)}
                size="small"
                clickable
                color={
                  form.categories.includes(category.slug)
                    ? category.restricted
                      ? 'warning'
                      : 'primary'
                    : 'default'
                }
                variant={form.categories.includes(category.slug) ? 'filled' : 'outlined'}
                onClick={() => toggleCategory(category.slug)}
              />
            ))}
          </Stack>

          <FormControlLabel
            control={
              <Switch
                checked={form.published}
                onChange={(event) => set('published', event.target.checked)}
              />
            }
            label={t('quotesAdmin.published')}
          />

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('quotesAdmin.cancel')}</Button>
        <Button variant="contained" onClick={handleSave} disabled={!valid || saving}>
          {t('quotesAdmin.save')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
