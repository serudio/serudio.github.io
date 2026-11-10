import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { alpha } from '@mui/material/styles'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useParams } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Link from '@mui/material/Link'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PaletteIcon from '@mui/icons-material/Palette'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import CloseIcon from '@mui/icons-material/Close'
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd'
import Collapse from '@mui/material/Collapse'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Seo from '../../components/Seo'
import Footer from '../../components/Footer'
import {
  addItems,
  addNotes,
  createCategory,
  deleteItem,
  deleteNote,
  getCategories,
  getItems,
  getNotes,
  getTrips,
  removeCategoryFromTrip,
  updateCategory,
  updateItem,
  updateNote,
  updateTrip,
  type TravelCategory,
  type TravelItem,
  type TravelNote,
  type TravelTrip,
} from '../../lib/travel/db'

const HIDE_DONE_KEY = 'serudio_travel_hide_done'

/** Offered when recolouring a section. Same family as the site's palette. */
const PALETTE = [
  '#6366f1', '#38bdf8', '#a855f7', '#ec4899', '#ef4444',
  '#f97316', '#f59e0b', '#84cc16', '#16a34a', '#14b8a6',
  '#0ea5e9', '#64748b',
]

/**
 * Done sinks to the bottom, and within each half the saved order holds.
 * Sorting here rather than in the database keeps it a view concern: the
 * row's sort_order still means the order you arranged it in, and ticking
 * something off does not rewrite the list for every other device.
 *
 * Array.sort is stable, so equal rows keep their relative order.
 */
function doneLast<T extends { sortOrder: number }>(rows: T[], isDone: (row: T) => boolean): T[] {
  return [...rows].sort(
    (a, b) => Number(isDone(a)) - Number(isDone(b)) || a.sortOrder - b.sortOrder,
  )
}

/** A section with no colour of its own still needs to render as something. */
function colorFor(category: TravelCategory, index: number): string {
  return category.color ?? PALETTE[index % PALETTE.length]
}

/**
 * One trip: what to do before leaving, and what to pack, by section.
 *
 * The default list is a trip too (is_template), so this same page edits
 * it — "add a section to the default" and "add it to this trip" are the
 * same screen with a different id.
 */
export default function TravelTripPage() {
  const { t } = useTranslation()
  const { tripId } = useParams<{ tripId: string }>()

  const [trip, setTrip] = useState<TravelTrip | null>(null)
  const [categories, setCategories] = useState<TravelCategory[]>([])
  const [items, setItems] = useState<TravelItem[]>([])
  const [notes, setNotes] = useState<TravelNote[]>([])
  const [loading, setLoading] = useState(true)
  // Only the first load gets the spinner. Refetching after an edit used
  // to flip `loading` back on, which unmounted the whole list and read
  // as the page blinking on every click.
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newItemText, setNewItemText] = useState<Record<string, string>>({})
  const [newNote, setNewNote] = useState('')
  const [newSection, setNewSection] = useState('')
  const [menu, setMenu] = useState<{ anchor: HTMLElement; categoryId: string } | null>(null)
  // Sections the visitor has opened back up after finishing them. A
  // finished section folds itself away; this remembers the ones they
  // want kept open regardless.
  const [reopened, setReopened] = useState<Record<string, boolean>>({})

  // The default list, so this trip can offer to keep anything it has
  // picked up along the way. Read from the trips already fetched rather
  // than through ensureTemplateTrip, which writes.
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [templateItems, setTemplateItems] = useState<TravelItem[]>([])

  // Remembered per browser: whether to show what is already done is a
  // working preference, not something worth a column in the database.
  const [hideDone, setHideDone] = useState(() => {
    try {
      return localStorage.getItem(HIDE_DONE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(HIDE_DONE_KEY, String(hideDone))
    } catch {
      // Private browsing; the choice just will not outlive the visit.
    }
  }, [hideDone])

  const [notesOpen, setNotesOpen] = useState(true)
  // Re-armed whenever packing resumes, so finishing again re-opens the
  // tasks — but collapsing them after that is respected rather than
  // fought on every render.
  const autoOpened = useRef(false)

  // Sections emptied just now. Deleting the last item used to make the
  // whole section disappear, taking the add field with it — so there
  // was no way back if the deletion was a mistake. They stay until
  // dismissed, or until the page is loaded afresh.
  const [emptied, setEmptied] = useState<string[]>([])

  // Naming a trip is optional and after the fact: creating one asks
  // nothing, so the details are edited here once there is something to
  // name.
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftStarts, setDraftStarts] = useState('')
  const [draftEnds, setDraftEnds] = useState('')

  const refresh = useCallback(async () => {
    if (!tripId) return
    setLoading(true)
    try {
      const [trips, cats, its, nts] = await Promise.all([
        getTrips(),
        getCategories(),
        getItems(tripId),
        getNotes(tripId),
      ])
      const current = trips.find((candidate) => candidate.id === tripId) ?? null
      setTrip(current)
      setCategories(cats)
      setItems(its)
      setNotes(nts)

      // Only meaningful on a real trip: the default list cannot differ
      // from itself.
      const template = current?.isTemplate ? undefined : trips.find((row) => row.isTemplate)
      setTemplateId(template?.id ?? null)
      setTemplateItems(template ? await getItems(template.id) : [])

      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setLoading(false)
      setLoaded(true)
    }
  }, [tripId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  /** For structural edits — adding, removing — where ids come back from
   *  the server and a refetch is the honest way to stay in step. */
  const run = async (action: () => Promise<void>) => {
    try {
      await action()
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    }
  }

  /**
   * For ticking things off. Applies the change locally first so the row
   * responds immediately, then writes it. Only a failure costs a
   * refetch, which also puts the row back the way the server has it.
   */
  const optimistic = (apply: () => void, write: () => Promise<void>) => {
    apply()
    void write().catch((caught) => {
      setError(caught instanceof Error ? caught.message : String(caught))
      void refresh()
    })
  }

  // Only sections that actually have items in this trip are shown: the
  // category list is account-wide, and an empty heading for a section
  // this trip does not use is noise.
  const sections = useMemo(() => {
    const used = categories
      .map((category, index) => {
        const all = items.filter((item) => item.categoryId === category.id)
        const entries = doneLast(
          hideDone ? all.filter((item) => !item.packed) : all,
          (item) => item.packed,
        )
        return {
          category,
          color: colorFor(category, index),
          entries,
          // Judged on every item, not the visible ones: with done
          // hidden, a finished section shows nothing and would
          // otherwise read as unfinished.
          done: all.length > 0 && all.every((item) => item.packed),
        }
      })
      .filter((section) => section.entries.length > 0 || emptied.includes(section.category.id))
      // A packed section is finished business: out of the way of the
      // ones still being worked through, and folded shut.
      .sort((a, b) => Number(a.done) - Number(b.done))

    const looseAll = items.filter((item) => !item.categoryId)
    const loose = doneLast(
      hideDone ? looseAll.filter((item) => !item.packed) : looseAll,
      (item) => item.packed,
    )
    return { used, loose }
  }, [categories, items, hideDone, emptied])

  /**
   * Per section, the items this trip has that the default list does not.
   * Compared on text within the same category, since a category row is
   * shared between the trip and the template — so "Шкарпетки" under
   * Clothes matches, and the same word under Hike does not.
   */
  const newToDefault = useMemo(() => {
    if (!templateId) return new Map<string, TravelItem[]>()

    const known = new Set(
      templateItems.map((item) => `${item.categoryId ?? ''}|${item.text.trim().toLowerCase()}`),
    )

    const result = new Map<string, TravelItem[]>()
    for (const item of items) {
      if (!item.categoryId) continue
      if (known.has(`${item.categoryId}|${item.text.trim().toLowerCase()}`)) continue
      result.set(item.categoryId, [...(result.get(item.categoryId) ?? []), item])
    }
    return result
  }, [templateId, templateItems, items])

  /**
   * The mirror of newToDefault: per section, what the default list has
   * that this trip does not. Deleting something you turned out to need,
   * or starting a section from scratch, both end here — the default is
   * the thing worth copying back from.
   */
  const missingFromTrip = useMemo(() => {
    if (!templateId) return new Map<string, TravelItem[]>()

    const here = new Set(
      items.map((item) => `${item.categoryId ?? ''}|${item.text.trim().toLowerCase()}`),
    )

    const result = new Map<string, TravelItem[]>()
    for (const item of templateItems) {
      if (!item.categoryId) continue
      if (here.has(`${item.categoryId}|${item.text.trim().toLowerCase()}`)) continue
      result.set(item.categoryId, [...(result.get(item.categoryId) ?? []), item])
    }
    return result
  }, [templateId, templateItems, items])

  const packed = items.filter((item) => item.packed).length
  const progress = items.length > 0 ? Math.round((packed / items.length) * 100) : 0

  const pendingNotes = notes.filter((note) => !note.done).length
  const allPacked = items.length > 0 && packed === items.length

  // Tasks are easy to fold away and then forget. Once there is nothing
  // left to pack they are all that stands between you and the door, so
  // they come back open.
  useEffect(() => {
    if (!allPacked) {
      autoOpened.current = false
      return
    }
    if (pendingNotes > 0 && !autoOpened.current) {
      setNotesOpen(true)
      autoOpened.current = true
    }
  }, [allPacked, pendingNotes])

  if (loading && !loaded) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" disableGutters>
      <Seo title={trip?.name ?? t('travel.title')} path={`/travel/t/${tripId ?? ''}`} noIndex />
      <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Link
          component={RouterLink}
          to="/travel"
          variant="body2"
          color="text.secondary"
          sx={{ display: 'inline-block', mb: 2 }}
        >
          &larr; {t('travel.backToTravel')}
        </Link>

        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="h5" component="h1">
            {trip?.name ?? t('travel.title')}
          </Typography>
          <Tooltip title={t('travel.editDetails')}>
            <IconButton
              size="small"
              aria-label={t('travel.editDetails')}
              onClick={() => {
                setDraftName(trip?.name ?? '')
                setDraftStarts(trip?.startsOn ?? '')
                setDraftEnds(trip?.endsOn ?? '')
                setEditing(true)
              }}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        {(trip?.startsOn || trip?.endsOn) && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {[trip?.startsOn, trip?.endsOn].filter(Boolean).join(' — ')}
          </Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {items.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {t('travel.packedCount', { packed, total: items.length })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {progress}%
              </Typography>
            </Stack>
            <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 1 }} />
            <FormControlLabel
              sx={{ mt: 0.5 }}
              control={
                <Switch
                  size="small"
                  checked={hideDone}
                  onChange={(event) => setHideDone(event.target.checked)}
                />
              }
              label={
                <Typography variant="caption" color="text.secondary">
                  {t('travel.hideDone')}
                </Typography>
              }
            />
          </Box>
        )}

        {/* Before leaving — tasks, not luggage. */}
        <Box
          sx={{
            mb: 3,
            p: 1.5,
            borderRadius: 2,
            border: '1px solid',
            // Anything outstanding stays visible even folded away: the
            // whole block carries a warning tint until it is clear.
            borderColor: (theme) =>
              pendingNotes > 0 ? alpha(theme.palette.warning.main, 0.4) : 'divider',
            bgcolor: (theme) =>
              pendingNotes > 0 ? alpha(theme.palette.warning.main, 0.08) : 'transparent',
          }}
        >
          <Stack
            direction="row"
            sx={{ alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
            onClick={() => setNotesOpen((previous) => !previous)}
          >
            <IconButton
              size="small"
              sx={{ p: 0.25 }}
              aria-expanded={notesOpen}
              aria-label={t('travel.beforeLeaving')}
            >
              {notesOpen ? (
                <ExpandMoreIcon fontSize="small" />
              ) : (
                <ChevronRightIcon fontSize="small" />
              )}
            </IconButton>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              {t('travel.beforeLeaving').toUpperCase()}
            </Typography>
            {pendingNotes > 0 && (
              <Chip size="small" color="warning" variant="outlined" label={pendingNotes} />
            )}
          </Stack>
          <Collapse in={notesOpen} unmountOnExit>
          {doneLast(hideDone ? notes.filter((note) => !note.done) : notes, (note) => note.done).map((note) => (
            <Stack key={note.id} direction="row" sx={{ alignItems: 'center' }}>
              <Checkbox
                size="small"
                checked={note.done}
                onChange={() =>
                  optimistic(
                    () =>
                      setNotes((previous) =>
                        previous.map((row) =>
                          row.id === note.id ? { ...row, done: !row.done } : row,
                        ),
                      ),
                    () => updateNote(note.id, { done: !note.done }),
                  )
                }
                sx={{ p: 0.5 }}
              />
              <Typography
                variant="body2"
                sx={{
                  flexGrow: 1,
                  textDecoration: note.done ? 'line-through' : 'none',
                  color: note.done ? 'text.disabled' : 'text.primary',
                }}
              >
                {note.text}
              </Typography>
              <IconButton
                size="small"
                sx={{ p: 0.5 }}
                onClick={() =>
                  optimistic(
                    () => setNotes((previous) => previous.filter((row) => row.id !== note.id)),
                    () => deleteNote(note.id),
                  )
                }
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              value={newNote}
              placeholder={t('travel.addNote')}
              onChange={(event) => setNewNote(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && newNote.trim() && tripId) {
                  void run(async () => {
                    await addNotes(tripId, [newNote])
                    setNewNote('')
                  })
                }
              }}
            />
          </Stack>
          </Collapse>
        </Box>

        {/* Packing, by section, flowed into columns. CSS columns rather
            than a grid: sections vary a lot in length, and columns pack
            them by height instead of letting one short section hold
            open a tall row. */}
        <Box
          sx={{
            columnCount: { xs: 1, sm: 2, md: 3 },
            columnGap: 3,
            mb: 2,
          }}
        >
        {sections.used.map(({ category, color, entries, done }) => {
          const open = !done || reopened[category.id] === true

          return (
          <Box
            key={category.id}
            sx={{
              // Keep a section whole rather than splitting its items
              // across a column break.
              breakInside: 'avoid',
              WebkitColumnBreakInside: 'avoid',
              display: 'inline-block',
              width: '100%',
              mb: 2,
              p: 1.5,
              borderRadius: 2,
              // The chosen colour tints the whole section rather than
              // marking it with a dot. Low alpha on both fill and edge
              // so the same hex stays readable on a dark ground and a
              // light one — a solid fill would work on neither.
              bgcolor: alpha(color, 0.1),
              border: '1px solid',
              borderColor: alpha(color, 0.35),
            }}
          >
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
              {done && (
                <IconButton
                  size="small"
                  sx={{ p: 0.25 }}
                  aria-label={category.name}
                  aria-expanded={open}
                  onClick={() =>
                    setReopened((previous) => ({
                      ...previous,
                      [category.id]: !open,
                    }))
                  }
                >
                  {open ? (
                    <ExpandMoreIcon fontSize="small" />
                  ) : (
                    <ChevronRightIcon fontSize="small" />
                  )}
                </IconButton>
              )}
              {category.isPerson && (
                <PersonOutlineIcon fontSize="small" sx={{ color: color, flexShrink: 0 }} />
              )}
              <Typography
                variant="subtitle2"
                sx={{ flexGrow: 1, opacity: done ? 0.7 : 1 }}
              >
                {category.name}
              </Typography>
              {entries.length === 0 && (
                <Tooltip title={t('travel.dismissSection')}>
                  <IconButton
                    size="small"
                    sx={{ p: 0.25 }}
                    aria-label={t('travel.dismissSection')}
                    onClick={() =>
                      setEmptied((rows) => rows.filter((id) => id !== category.id))
                    }
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Chip
                size="small"
                variant="outlined"
                label={`${entries.filter((item) => item.packed).length}/${entries.length}`}
              />
              <Tooltip title={t('travel.sectionActions')}>
                <IconButton
                  size="small"
                  onClick={(event) =>
                    setMenu({ anchor: event.currentTarget, categoryId: category.id })
                  }
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            <Collapse in={open} unmountOnExit>
            {entries.map((item) => (
              <Stack key={item.id} direction="row" sx={{ alignItems: 'center' }}>
                <Checkbox
                  size="small"
                  checked={item.packed}
                  onChange={() =>
                    optimistic(
                      () =>
                        setItems((previous) =>
                          previous.map((row) =>
                            row.id === item.id ? { ...row, packed: !row.packed } : row,
                          ),
                        ),
                      () => updateItem(item.id, { packed: !item.packed }),
                    )
                  }
                  sx={{ p: 0.5 }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    flexGrow: 1,
                    textDecoration: item.packed ? 'line-through' : 'none',
                    color: item.packed ? 'text.disabled' : 'text.primary',
                  }}
                >
                  {item.text}
                </Typography>
                <IconButton
                  size="small"
                  sx={{ p: 0.5 }}
                  onClick={() =>
                    optimistic(
                      () => {
                        setItems((previous) => {
                          const next = previous.filter((row) => row.id !== item.id)
                          const last = !next.some(
                            (row) => row.categoryId === item.categoryId,
                          )
                          if (last && item.categoryId) {
                            setEmptied((rows) =>
                              rows.includes(item.categoryId!) ? rows : [...rows, item.categoryId!],
                            )
                          }
                          return next
                        })
                      },
                      () => deleteItem(item.id),
                    )
                  }
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}

            <TextField
              size="small"
              fullWidth
              sx={{ mt: 1 }}
              value={newItemText[category.id] ?? ''}
              placeholder={t('travel.addItem')}
              onChange={(event) =>
                setNewItemText((previous) => ({ ...previous, [category.id]: event.target.value }))
              }
              onKeyDown={(event) => {
                const text = newItemText[category.id] ?? ''
                if (event.key === 'Enter' && text.trim() && tripId) {
                  void run(async () => {
                    await addItems(tripId, [{ text, categoryId: category.id }])
                    setNewItemText((previous) => ({ ...previous, [category.id]: '' }))
                  })
                }
              }}
            />
            </Collapse>
          </Box>
          )
        })}
        </Box>

        {sections.loose.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('travel.uncategorised')}
            </Typography>
            {sections.loose.map((item) => (
              <Stack key={item.id} direction="row" sx={{ alignItems: 'center' }}>
                <Checkbox
                  size="small"
                  checked={item.packed}
                  onChange={() =>
                    optimistic(
                      () =>
                        setItems((previous) =>
                          previous.map((row) =>
                            row.id === item.id ? { ...row, packed: !row.packed } : row,
                          ),
                        ),
                      () => updateItem(item.id, { packed: !item.packed }),
                    )
                  }
                  sx={{ p: 0.5 }}
                />
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  {item.text}
                </Typography>
                <IconButton
                  size="small"
                  sx={{ p: 0.5 }}
                  onClick={() =>
                    optimistic(
                      () =>
                        setItems((previous) => previous.filter((row) => row.id !== item.id)),
                      () => deleteItem(item.id),
                    )
                  }
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Box>
        )}

        {/* Your own section, alongside the recommended ones. */}
        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          <TextField
            size="small"
            fullWidth
            value={newSection}
            placeholder={t('travel.newSection')}
            onChange={(event) => setNewSection(event.target.value)}
          />
          <Button
            startIcon={<AddIcon />}
            disabled={!newSection.trim() || !tripId}
            onClick={() =>
              void run(async () => {
                const categoryId = await createCategory({
                  name: newSection,
                  color: PALETTE[categories.length % PALETTE.length],
                  sortOrder: categories.length,
                })
                // A section with no items would not render, so it starts
                // with its own name as the first thing to replace.
                await addItems(tripId!, [{ text: newSection.trim(), categoryId }])
                setNewSection('')
              })
            }
          >
            {t('travel.add')}
          </Button>
        </Stack>

        <Button
          size="small"
          component={RouterLink}
          to="/travel/recommended"
          startIcon={<AddIcon />}
        >
          {t('travel.addFromRecommended')}
        </Button>

        <Footer />
      </Paper>

      <Dialog open={editing} onClose={() => setEditing(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t('travel.editDetails')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t('travel.tripName')}
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              fullWidth
              autoFocus
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label={t('travel.startsOn')}
                type="date"
                value={draftStarts}
                onChange={(event) => setDraftStarts(event.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label={t('travel.endsOn')}
                type="date"
                value={draftEnds}
                onChange={(event) => setDraftEnds(event.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(false)}>{t('travel.cancel')}</Button>
          <Button
            variant="contained"
            disabled={!draftName.trim() || !tripId}
            onClick={() =>
              void run(async () => {
                await updateTrip(tripId!, {
                  name: draftName,
                  startsOn: draftStarts,
                  endsOn: draftEnds,
                })
                setEditing(false)
              })
            }
          >
            {t('travel.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        open={menu !== null}
        anchorEl={menu?.anchor ?? null}
        onClose={() => setMenu(null)}
      >
        <MenuItem disabled sx={{ opacity: 1 }}>
          <PaletteIcon fontSize="small" sx={{ mr: 1 }} />
          {t('travel.sectionColor')}
        </MenuItem>
        <Box sx={{ px: 2, pb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.75, maxWidth: 200 }}>
          {PALETTE.map((color) => (
            <Box
              key={color}
              role="button"
              aria-label={color}
              onClick={() => {
                const categoryId = menu?.categoryId
                setMenu(null)
                if (categoryId) void run(() => updateCategory(categoryId, { color }))
              }}
              sx={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                bgcolor: color,
                cursor: 'pointer',
                border: '2px solid transparent',
                '&:hover': { borderColor: 'text.primary' },
              }}
            />
          ))}
        </Box>
        {menu && (newToDefault.get(menu.categoryId)?.length ?? 0) > 0 && (
          <MenuItem
            onClick={() => {
              const categoryId = menu.categoryId
              const missing = newToDefault.get(categoryId) ?? []
              setMenu(null)
              if (templateId) {
                void run(async () => {
                  await addItems(
                    templateId,
                    missing.map((item) => ({ text: item.text, categoryId })),
                  )
                })
              }
            }}
          >
            <BookmarkAddOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
            {t('travel.keepInDefault', {
              count: newToDefault.get(menu.categoryId)?.length ?? 0,
            })}
          </MenuItem>
        )}

        {menu && (missingFromTrip.get(menu.categoryId)?.length ?? 0) > 0 && (
          <MenuItem
            onClick={() => {
              const categoryId = menu.categoryId
              const missing = missingFromTrip.get(categoryId) ?? []
              setMenu(null)
              if (tripId) {
                void run(() =>
                  addItems(
                    tripId,
                    // Only what is absent: the comparison above already
                    // dropped anything this trip has, so adding the same
                    // section twice tops it up rather than doubling it.
                    missing.map((item) => ({ text: item.text, categoryId })),
                  ),
                )
              }
            }}
          >
            <PlaylistAddIcon fontSize="small" sx={{ mr: 1 }} />
            {t('travel.refillFromDefault', {
              count: missingFromTrip.get(menu.categoryId)?.length ?? 0,
            })}
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            const category = categories.find((row) => row.id === menu?.categoryId)
            setMenu(null)
            if (category) {
              void run(() => updateCategory(category.id, { isPerson: !category.isPerson }))
            }
          }}
        >
          <PersonOutlineIcon fontSize="small" sx={{ mr: 1 }} />
          {t(
            categories.find((row) => row.id === menu?.categoryId)?.isPerson
              ? 'travel.unmarkPerson'
              : 'travel.markPerson',
          )}
        </MenuItem>

        <MenuItem
          onClick={() => {
            const categoryId = menu?.categoryId
            setMenu(null)
            if (categoryId && tripId) {
              void run(() => removeCategoryFromTrip(tripId, categoryId))
            }
          }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          {t('travel.removeSection')}
        </MenuItem>
      </Menu>
    </Container>
  )
}
