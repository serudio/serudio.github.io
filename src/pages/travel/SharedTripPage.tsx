import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { alpha } from '@mui/material/styles'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import DeleteIcon from '@mui/icons-material/Delete'
import Seo from '../../components/Seo'
import Footer from '../../components/Footer'
import { useAuth } from '../../auth/useAuth'
import { ROW_HOVER } from './rowStyles'
import {
  getSharedTrip,
  sharedAddItem,
  sharedDeleteItem,
  sharedSetItem,
  sharedSetNote,
  type SharedTrip,
} from '../../lib/travel/db'

const PALETTE = [
  '#6366f1', '#38bdf8', '#a855f7', '#ec4899', '#ef4444',
  '#f97316', '#f59e0b', '#84cc16', '#16a34a', '#14b8a6',
  '#0ea5e9', '#64748b',
]

/**
 * A trip opened from a shared link.
 *
 * Readable by anyone holding the link; editable once signed in, which
 * is the point — the list is worked on by whoever is doing the packing.
 * Every call goes through the database functions in migration 0014,
 * which re-check the token and resolve the trip from it, so nothing
 * here can reach a trip the link does not name.
 *
 * The token rides in the query string rather than the path because
 * GitHub Pages has no SPA rewrite: only paths that exist as files are
 * served, so /travel/s/<token> would fall through to 404.html and be
 * answered with a real HTTP 404. /travel/share is a generated file, so
 * the one URL that gets sent to other people loads with a 200.
 *
 * noindex: a link meant for one family is not a page for search
 * results, however unguessable the token.
 */
export default function SharedTripPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const token = params.get('t')
  const { session } = useAuth()

  const [data, setData] = useState<SharedTrip | null>(null)
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newItem, setNewItem] = useState<Record<string, string>>({})

  const canEdit = Boolean(session)

  const refresh = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      setData(await getSharedTrip(token))
      setError(null)
    } catch {
      // A revoked or mistyped token is indistinguishable from a trip
      // that never existed, deliberately.
      setError(t('travel.sharedMissing'))
    } finally {
      setLoading(false)
      setLoaded(true)
    }
  }, [token, t])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const sections = useMemo(() => {
    if (!data) return []
    return data.categories
      .map((category, index) => ({
        category,
        color: category.color ?? PALETTE[index % PALETTE.length],
        entries: data.items
          .filter((item) => item.categoryId === category.id)
          .sort((a, b) => Number(a.packed) - Number(b.packed) || a.sortOrder - b.sortOrder),
      }))
      .filter((section) => section.entries.length > 0)
  }, [data])

  const packed = data?.items.filter((item) => item.packed).length ?? 0
  const total = data?.items.length ?? 0
  const progress = total > 0 ? Math.round((packed / total) * 100) : 0

  /** Applies locally, writes, and only reconciles when the write fails. */
  const optimistic = (apply: () => void, write: () => Promise<void>) => {
    apply()
    void write().catch((caught) => {
      setError(caught instanceof Error ? caught.message : String(caught))
      void refresh()
    })
  }

  if (loading && !loaded) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" disableGutters>
      <Seo title={data?.trip.name ?? t('travel.title')} path="/travel/share" noIndex />
      <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3 } }}>
        {error && !data ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <Stack
              direction="row"
              useFlexGap
              flexWrap="wrap"
              sx={{ alignItems: 'center', gap: 1, mb: 1 }}
            >
              <Typography
                variant="h5"
                component="h1"
                // Set like the section headings, a size up: the trip
                // name and the sections under it are the same kind of
                // label, so they are lettered the same way.
                sx={{ textTransform: 'uppercase', letterSpacing: '1.2px' }}
              >
                {data?.trip.name}
              </Typography>
              <Chip size="small" variant="outlined" label={t('travel.sharedBadge')} />
              <Box sx={{ flexGrow: 1 }} />
              {total > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {t('travel.packedCount', { packed, total })} · {progress}%
                </Typography>
              )}
            </Stack>

            {total > 0 && (
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ borderRadius: 1, mb: 2 }}
              />
            )}

            {!canEdit && (
              <Alert severity="info" sx={{ mb: 3 }}>
                {t('travel.sharedReadOnly')}
              </Alert>
            )}

            {error && data && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {(data?.notes.length ?? 0) > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={700}
                  sx={{ letterSpacing: '1.1px' }}
                >
                  {t('travel.beforeLeaving').toUpperCase()}
                </Typography>
                {data?.notes.map((note) => (
                  <Stack
                    key={note.id}
                    direction="row"
                    sx={{ alignItems: 'center', ...ROW_HOVER }}
                  >
                    <Checkbox
                      size="small"
                      sx={{ p: 0.5 }}
                      checked={note.done}
                      disabled={!canEdit}
                      onChange={() =>
                        optimistic(
                          () =>
                            setData((previous) =>
                              previous
                                ? {
                                    ...previous,
                                    notes: previous.notes.map((row) =>
                                      row.id === note.id ? { ...row, done: !row.done } : row,
                                    ),
                                  }
                                : previous,
                            ),
                          () => sharedSetNote(token!, note.id, !note.done),
                        )
                      }
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        textTransform: 'lowercase',
                        letterSpacing: '1.25px',
                        textDecoration: note.done ? 'line-through' : 'none',
                        color: note.done ? 'text.disabled' : 'text.primary',
                      }}
                    >
                      {note.text}
                    </Typography>
                  </Stack>
                ))}
              </Box>
            )}

            <Box sx={{ columnCount: { xs: 1, sm: 2, md: 3 }, columnGap: 3 }}>
              {sections.map(({ category, color, entries }) => (
                <Box
                  key={category.id}
                  sx={{
                    breakInside: 'avoid',
                    WebkitColumnBreakInside: 'avoid',
                    display: 'inline-block',
                    width: '100%',
                    mb: 2,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(color, 0.1),
                    border: '1px solid',
                    borderColor: alpha(color, 0.35),
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ textTransform: 'uppercase', letterSpacing: '1.1px', mb: 0.5 }}
                  >
                    {category.name}
                  </Typography>

                  {entries.map((item) => (
                    <Stack
                      key={item.id}
                      direction="row"
                      sx={{
                        alignItems: 'center',
                        ...ROW_HOVER,
                      }}
                    >
                      <Checkbox
                        size="small"
                        sx={{ p: 0.5 }}
                        checked={item.packed}
                        disabled={!canEdit}
                        onChange={() =>
                          optimistic(
                            () =>
                              setData((previous) =>
                                previous
                                  ? {
                                      ...previous,
                                      items: previous.items.map((row) =>
                                        row.id === item.id
                                          ? { ...row, packed: !row.packed }
                                          : row,
                                      ),
                                    }
                                  : previous,
                              ),
                            () => sharedSetItem(token!, item.id, !item.packed),
                          )
                        }
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          flexGrow: 1,
                          textTransform: 'lowercase',
                          letterSpacing: '1.25px',
                          textDecoration: item.packed ? 'line-through' : 'none',
                          color: item.packed ? 'text.disabled' : 'text.primary',
                        }}
                      >
                        {item.text}
                      </Typography>
                      {canEdit && (
                        <IconButton
                          size="small"
                          sx={{ p: 0.5 }}
                          onClick={() =>
                            optimistic(
                              () =>
                                setData((previous) =>
                                  previous
                                    ? {
                                        ...previous,
                                        items: previous.items.filter((row) => row.id !== item.id),
                                      }
                                    : previous,
                                ),
                              () => sharedDeleteItem(token!, item.id),
                            )
                          }
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  ))}

                  {canEdit && (
                    <TextField
                      size="small"
                      fullWidth
                      sx={{ mt: 1 }}
                      value={newItem[category.id] ?? ''}
                      placeholder={t('travel.addItem')}
                      onChange={(event) =>
                        setNewItem((previous) => ({
                          ...previous,
                          [category.id]: event.target.value,
                        }))
                      }
                      onKeyDown={(event) => {
                        const text = newItem[category.id] ?? ''
                        if (event.key !== 'Enter' || !text.trim() || !token) return
                        void sharedAddItem(token, category.id, text)
                          .then(() => {
                            setNewItem((previous) => ({ ...previous, [category.id]: '' }))
                            return refresh()
                          })
                          .catch((caught) =>
                            setError(
                              caught instanceof Error ? caught.message : String(caught),
                            ),
                          )
                      }}
                    />
                  )}
                </Box>
              ))}
            </Box>
          </>
        )}

        <Footer />
      </Paper>
    </Container>
  )
}
