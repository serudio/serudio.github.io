import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { alpha, useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
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
import Menu from '@mui/material/Menu'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import DeleteIcon from '@mui/icons-material/Delete'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PaletteIcon from '@mui/icons-material/Palette'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import CloseIcon from '@mui/icons-material/Close'
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd'
import SearchIcon from '@mui/icons-material/Search'
import InputAdornment from '@mui/material/InputAdornment'
import Collapse from '@mui/material/Collapse'
import ToggleButton from '@mui/material/ToggleButton'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import IosShareIcon from '@mui/icons-material/IosShare'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Seo from '../../components/Seo'
import Footer from '../../components/Footer'
import { useDeclarePageChrome } from '../../components/pageChrome'
import { exportCsv, exportList } from '../../lib/travel/exportList'
import { SITE_URL } from '../../config/site'
import { ROW_HOVER } from './rowStyles'
import {
  addItems,
  disableShare,
  enableShare,
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
  // Explicit open/closed per section, overriding the default. Without an
  // entry a section follows whether it is finished: done folds itself
  // away, unfinished stays open.
  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>({})

  // The default list, so this trip can offer to keep anything it has
  // picked up along the way. Read from the trips already fetched rather
  // than through ensureTemplateTrip, which writes.
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [templateItems, setTemplateItems] = useState<TravelItem[]>([])
  const [templateNotes, setTemplateNotes] = useState<TravelNote[]>([])

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

  // Folded to start with: packing is what the page is for, and the
  // tasks are for the last minute. The warning tint on the block says
  // something is outstanding without it having to stand open, and the
  // effect below opens it once there is nothing left to pack.
  const [notesOpen, setNotesOpen] = useState(false)
  // Re-armed whenever packing resumes, so finishing again re-opens the
  // tasks — but collapsing them after that is respected rather than
  // fought on every render.
  const autoOpened = useRef(false)

  // Sections emptied just now. Deleting the last item used to make the
  // whole section disappear, taking the add field with it — so there
  // was no way back if the deletion was a mistake. They stay until
  // dismissed, or until the page is loaded afresh.
  const [emptied, setEmptied] = useState<string[]>([])
  const [query, setQuery] = useState('')
  // Whose things to show. Null is everyone's.
  /**
   * Whose sections to show. Empty means everyone — several people can
   * be on at once, because packing is usually done for more than one of
   * them at a time.
   */
  const [personFilter, setPersonFilter] = useState<string[]>([])
  // The item being renamed, and the text so far. Editing in place beats
  // a dialog for a one-line change.
  const [editingItem, setEditingItem] = useState<{ id: string; text: string } | null>(null)
  const [editingSection, setEditingSection] = useState<{ id: string; name: string } | null>(
    null,
  )

  // Naming a trip is optional and after the fact: creating one asks
  // nothing, so the details are edited here once there is something to
  // name.
  const [editing, setEditing] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [listCopied, setListCopied] = useState(false)
  const [exportMenu, setExportMenu] = useState<HTMLElement | null>(null)
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
      setTemplateNotes(template ? await getNotes(template.id) : [])

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
    const needle = query.trim().toLowerCase()
    // A section whose own name matches keeps all of its items: you
    // searched for the section, not for something inside it.
    const matches = (item: TravelItem, categoryName: string) =>
      !needle ||
      categoryName.toLowerCase().includes(needle) ||
      item.text.toLowerCase().includes(needle)

    const used = categories
      .filter(
        (category) =>
          personFilter.length === 0 ||
          personFilter.includes(category.id) ||
          (category.personId !== null && personFilter.includes(category.personId)),
      )
      .map((category, index) => {
        const all = items
          .filter((item) => item.categoryId === category.id)
          .filter((item) => matches(item, category.name))
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
      .filter(
        (section) =>
          section.entries.length > 0 ||
          (!needle && emptied.includes(section.category.id)),
      )
      // A packed section is finished business: out of the way of the
      // ones still being worked through, and folded shut.
      .sort((a, b) => Number(a.done) - Number(b.done))

    const looseAll = items
      .filter((item) => !item.categoryId)
      .filter((item) => matches(item, ''))
    const loose = doneLast(
      hideDone ? looseAll.filter((item) => !item.packed) : looseAll,
      (item) => item.packed,
    )
    return { used, loose }
  }, [categories, items, hideDone, emptied, query, personFilter])

  useDeclarePageChrome({
    backTo: '/travel',
    backLabel: t('travel.backToTravel'),
    width: 'lg',
  })

  const theme = useTheme()
  const wide = useMediaQuery(theme.breakpoints.up('md'))
  const medium = useMediaQuery(theme.breakpoints.up('sm'))
  const columnCount = wide ? 3 : medium ? 2 : 1

  /**
   * Sections dealt into fixed columns, shortest column first.
   *
   * Weighted by how many items a section has, never by how tall it is
   * on screen: a collapsed section weighs exactly what an open one
   * does, so folding it cannot send its neighbours to another column.
   * The columns go unbalanced for as long as something is folded, which
   * is the price of nothing moving — and the better trade, since a
   * fold is a deliberate act whose result should be predictable.
   */
  const columns = useMemo(() => {
    const dealt: (typeof sections.used)[] = Array.from(
      { length: columnCount },
      () => [],
    )
    const weights = new Array<number>(columnCount).fill(0)

    for (const section of sections.used) {
      let lightest = 0
      for (let index = 1; index < columnCount; index += 1) {
        if (weights[index] < weights[lightest]) lightest = index
      }
      dealt[lightest].push(section)
      // The header and the add-an-item field cost about two rows.
      weights[lightest] += section.entries.length + 2
    }

    return dealt
  }, [sections, columnCount])

  /**
   * Per section, the items this trip has that the default list does not.
   * Compared on text within the same category, since a category row is
   * shared between the trip and the template — so "Шкарпетки" under
   * Clothes matches, and the same word under Hike does not.
   */
  const people = useMemo(
    () => categories.filter((category) => category.isPerson),
    [categories],
  )

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

  /**
   * Creating a section. An empty one would not render, so it opens with
   * its own name as the first item — something to rename rather than a
   * blank box. Shared by the Add button and the Enter key.
   */
  const addSection = () => {
    const name = newSection.trim()
    if (!name || !tripId) return

    void run(async () => {
      const categoryId = await createCategory({
        name,
        color: PALETTE[categories.length % PALETTE.length],
        sortOrder: categories.length,
      })
      await addItems(tripId, [{ text: name, categoryId }])
      setNewSection('')
    })
  }

  /** Commits a rename, or quietly drops it if nothing changed. */
  /** Commits a section rename, or quietly drops it if nothing changed. */
  const commitSectionEdit = () => {
    if (!editingSection) return
    const { id, name } = editingSection
    const original = categories.find((row) => row.id === id)
    setEditingSection(null)

    const trimmed = name.trim()
    if (!trimmed || !original || trimmed === original.name) return

    optimistic(
      () =>
        setCategories((previous) =>
          previous.map((row) => (row.id === id ? { ...row, name: trimmed } : row)),
        ),
      () => updateCategory(id, { name: trimmed }),
    )
  }

  const commitItemEdit = () => {
    if (!editingItem) return
    const { id, text } = editingItem
    const original = items.find((row) => row.id === id)
    setEditingItem(null)

    const trimmed = text.trim()
    if (!trimmed || !original || trimmed === original.text) return

    optimistic(
      () =>
        setItems((previous) =>
          previous.map((row) => (row.id === id ? { ...row, text: trimmed } : row)),
        ),
      () => updateItem(id, { text: trimmed }),
    )
  }

  /** Item ids the default list has never seen, for the per-row action. */
  const newToDefaultIds = useMemo(
    () => new Set([...newToDefault.values()].flat().map((item) => item.id)),
    [newToDefault],
  )

  /**
   * Tasks the default list has no match for, by text — a task has no
   * section to be told apart by, so the words are all there is.
   */
  const newNoteToDefaultIds = useMemo(() => {
    if (!templateId) return new Set<string>()
    const known = new Set(templateNotes.map((note) => note.text.trim().toLowerCase()))
    return new Set(
      notes
        .filter((note) => !known.has(note.text.trim().toLowerCase()))
        .map((note) => note.id),
    )
  }, [templateId, templateNotes, notes])

  /** Copies one task up into the default list, leaving the trip's alone. */
  const keepNote = (note: TravelNote) => {
    if (!templateId) return
    void run(() => addNotes(templateId, [note.text]))
  }

  /** Copies one item up into the default list, leaving the trip's alone. */
  const keepOne = (item: TravelItem) => {
    if (!templateId || !item.categoryId) return
    void run(() =>
      addItems(templateId, [{ text: item.text, categoryId: item.categoryId }]),
    )
  }

  /**
   * What "From default" can still add, per section.
   *
   * Built from missingFromTrip, so it covers both cases at once: a
   * section the trip never had comes with all its items, and one it
   * already has comes with only the items it is short of. It used to
   * list whole-section gaps alone, which meant the control vanished as
   * soon as every section existed here — exactly when topping one up is
   * what you want.
   *
   * A section with nothing missing is left out: an entry that would add
   * nothing is worse than no entry.
   */
  const defaultOnlySections = useMemo(
    () =>
      [...missingFromTrip.entries()]
        .map(([categoryId, rows]) => ({
          category: categories.find((row) => row.id === categoryId),
          rows,
        }))
        .filter((entry): entry is { category: TravelCategory; rows: TravelItem[] } =>
          entry.category !== undefined,
        ),
    [missingFromTrip, categories],
  )

  const [addSectionMenu, setAddSectionMenu] = useState<HTMLElement | null>(null)
  const [confirmRemove, setConfirmRemove] = useState<TravelCategory | null>(null)

  /**
   * Dropping a section from this trip.
   *
   * Asks first only when it cannot be undone: a section the default list
   * also holds can be put back from "From default" in one click, so
   * stopping to confirm that would be nagging. One that exists nowhere
   * else takes its items with it for good.
   */
  const removeSection = (category: TravelCategory, entryCount: number) => {
    // An emptied section is only a placeholder waiting to be filled;
    // dismissing it throws nothing away, so it needs no question.
    if (entryCount === 0) {
      setEmptied((rows) => rows.filter((id) => id !== category.id))
      return
    }
    // Everything else asks first, including sections the default list
    // also holds. Being able to add it back is not the same as not
    // having lost anything: the trip's own ticks and its added items go
    // with it, and one stray click should not be able to take them.
    setConfirmRemove(category)
  }

  const searching = query.trim().length > 0

  // Measured against what is on screen, so a section left over from a
  // longer list cannot make the button claim the wrong thing.
  // "Before leaving" folds with everything else, so the button leaves
  // nothing standing open behind it. It only counts when there are
  // tasks at all — an empty block is not something left expanded.
  const allCollapsed =
    sections.used.length > 0 &&
    sections.used.every(
      ({ category, done }) => (sectionOpen[category.id] ?? !done) === false,
    ) &&
    (notes.length === 0 || !notesOpen)

  const toggleAllSections = () => {
    const next: Record<string, boolean> = {}
    for (const { category } of sections.used) next[category.id] = allCollapsed
    setSectionOpen((previous) => ({ ...previous, ...next }))
    setNotesOpen(allCollapsed)
  }

  // The share link's token goes in the query string, not the path:
  // GitHub Pages serves only paths that exist as files, so a path
  // segment would fall through to 404.html with a real HTTP 404. See
  // SharedTripPage.
  const shareUrl = trip?.shareToken ? `${SITE_URL}/travel/share?t=${trip.shareToken}` : ''

  const downloadCsv = () => {
    if (!trip) return
    setExportMenu(null)
    const csv = exportCsv({
      categories,
      items,
      headers: {
        section: t('travel.csvSection'),
        item: t('travel.csvItem'),
        packed: t('travel.csvPacked'),
      },
      uncategorised: t('travel.uncategorised'),
    })

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${trip.name || 'travel'}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const copyList = () => {
    if (!trip) return
    setExportMenu(null)
    const text = exportList({
      trip,
      categories,
      items,
      notes,
      strings: {
        lead: t('travel.exportLead'),
        trip: t('travel.exportTrip'),
        dates: t('travel.exportDates'),
        beforeLeaving: t('travel.beforeLeaving'),
        uncategorised: t('travel.uncategorised'),
      },
    })
    void navigator.clipboard
      .writeText(text)
      .then(() => {
        setListCopied(true)
        // Back to the instructions after a moment: the tooltip's job is
        // to say what to do with the copy, not to report the copy.
        window.setTimeout(() => setListCopied(false), 2500)
      })
      // Clipboard access can be refused; saying nothing is better than
      // claiming a copy that did not happen.
      .catch(() => setError(t('travel.copyListFailed')))
  }

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
        <Stack
          direction="row"
          useFlexGap
          flexWrap="wrap"
          sx={{ alignItems: 'center', gap: 1, mb: 1 }}
        >
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

          {/* Says what to do with it, not just what it does: the copy
              is only useful if you know to paste it somewhere that can
              read it back to you. */}
          <Tooltip title={listCopied ? t('travel.copyListDone') : t('travel.copyListHint')}>
            <IconButton
              size="small"
              aria-label={t('travel.copyList')}
              onClick={(event) => setExportMenu(event.currentTarget)}
              color={listCopied ? 'primary' : 'default'}
            >
              <AutoAwesomeOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Menu
            open={exportMenu !== null}
            anchorEl={exportMenu}
            onClose={() => setExportMenu(null)}
          >
            <MenuItem onClick={copyList}>
              <AutoAwesomeOutlinedIcon fontSize="small" sx={{ mr: 1 }} />
              {t('travel.copyMenuAssistant')}
            </MenuItem>
            <MenuItem onClick={downloadCsv}>
              <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
              {t('travel.downloadCsv')}
            </MenuItem>
          </Menu>

          <Tooltip title={t('travel.share')}>
            <IconButton
              size="small"
              aria-label={t('travel.share')}
              color={trip?.shareToken ? 'primary' : 'default'}
              onClick={() => setSharing(true)}
            >
              <IosShareIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Box sx={{ flexGrow: 1 }} />

          {items.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              {t('travel.packedCount', { packed, total: items.length })} · {progress}%
            </Typography>
          )}
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
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ borderRadius: 1, mb: 2 }}
          />
        )}

        {/* Everything that acts on the page as a whole, in one bar:
            first what changes the view (search, whose sections, whether
            finished rows show, folded or not), then what adds a section
            (a new one, one the default list already has, one from the
            catalogue). The divider is the seam between looking and
            changing. */}
        <Stack
          direction="row"
          useFlexGap
          flexWrap="wrap"
          spacing={1}
          sx={{ rowGap: 1, alignItems: 'center', mb: 1.5 }}
        >
          <TextField
            size="small"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('travel.searchItems')}
            aria-label={t('travel.searchItems')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, minWidth: 180 }}
          />

          <Tooltip title={t('travel.hideDone')}>
            <ToggleButton
              size="small"
              value="hideDone"
              selected={hideDone}
              onChange={() => setHideDone((previous) => !previous)}
              aria-label={t('travel.hideDone')}
            >
              {hideDone ? (
                <VisibilityOffOutlinedIcon fontSize="small" />
              ) : (
                <VisibilityOutlinedIcon fontSize="small" />
              )}
            </ToggleButton>
          </Tooltip>

          <Button
            size="small"
            onClick={toggleAllSections}
            // A search opens every section for as long as it runs, so
            // folding them would do nothing visible.
            disabled={searching || sections.used.length === 0}
          >
            {t(allCollapsed ? 'travel.expandAll' : 'travel.collapseAll')}
          </Button>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <TextField
            size="small"
            value={newSection}
            onChange={(event) => setNewSection(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') addSection()
            }}
            placeholder={t('travel.newSection')}
            aria-label={t('travel.newSection')}
            sx={{ minWidth: 180 }}
          />

          {defaultOnlySections.length > 0 && (
            <Button
              size="small"
              startIcon={<PlaylistAddIcon />}
              onClick={(event) => setAddSectionMenu(event.currentTarget)}
            >
              {t('travel.addSectionFromDefault')}
            </Button>
          )}

          <Button
            size="small"
            component={RouterLink}
            to="/travel/recommended"
            startIcon={<PlaylistAddIcon />}
          >
            {t('travel.addFromRecommended')}
          </Button>
        </Stack>

        {/* People get their own row. They are the one filter whose
            options are worth reading at a glance rather than opening,
            and in the bar they pushed everything else around as soon as
            a trip had more than two. Each chip wears that person's own
            section colour, the same one their sections are tinted
            with. */}
        {people.length > 0 && (
          <Stack
            direction="row"
            useFlexGap
            flexWrap="wrap"
            sx={{ gap: 0.5, alignItems: 'center', mb: 3 }}
            role="group"
            aria-label={t('travel.whose')}
          >
            <Chip
              size="small"
              label={t('travel.everyone')}
              variant={personFilter.length === 0 ? 'filled' : 'outlined'}
              color={personFilter.length === 0 ? 'primary' : 'default'}
              onClick={() => setPersonFilter([])}
            />
            {people.map((person) => {
              const selected = personFilter.includes(person.id)
              const color = colorFor(person, categories.indexOf(person))
              return (
                <Chip
                  key={person.id}
                  size="small"
                  label={person.name}
                  variant={selected ? 'filled' : 'outlined'}
                  // Each chip toggles on its own; turning the last one
                  // off is the same as choosing everyone, so the filter
                  // needs no separate clear.
                  onClick={() =>
                    setPersonFilter((previous) =>
                      selected
                        ? previous.filter((id) => id !== person.id)
                        : [...previous, person.id],
                    )
                  }
                  sx={{
                    borderColor: alpha(color, 0.5),
                    bgcolor: selected ? alpha(color, 0.35) : 'transparent',
                    '&:hover': { bgcolor: alpha(color, selected ? 0.45 : 0.15) },
                  }}
                />
              )
            })}
          </Stack>
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
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
              sx={{ letterSpacing: '1.1px' }}
            >
              {t('travel.beforeLeaving').toUpperCase()}
            </Typography>
            {pendingNotes > 0 && (
              <Chip size="small" color="warning" variant="outlined" label={pendingNotes} />
            )}
          </Stack>
          <Collapse in={notesOpen} unmountOnExit>
          {doneLast(hideDone ? notes.filter((note) => !note.done) : notes, (note) => note.done).map((note) => (
            <Stack key={note.id} direction="row" sx={{ alignItems: 'center', ...ROW_HOVER }}>
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
                  textTransform: 'lowercase',
                  letterSpacing: '1.25px',
                  textDecoration: note.done ? 'line-through' : 'none',
                  color: note.done ? 'text.disabled' : 'text.primary',
                }}
              >
                {note.text}
              </Typography>
              {newNoteToDefaultIds.has(note.id) && (
                <Tooltip title={t('travel.keepThisInDefault')}>
                  <IconButton
                    size="small"
                    sx={{ p: 0.5 }}
                    aria-label={t('travel.keepThisInDefault')}
                    onClick={() => keepNote(note)}
                  >
                    <BookmarkAddOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
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

        {/* Packing, by section, in columns dealt here rather than by
            CSS. `column-count` re-balances the whole flow whenever any
            section's height changes, so folding one section re-dealt
            every other one and sections jumped between columns under
            the pointer. These columns are packed by item count, which a
            fold does not change — so opening and closing a section
            moves nothing but that section. */}
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', mb: 2 }}>
        {columns.map((column, columnIndex) => (
        <Box key={columnIndex} sx={{ flex: 1, minWidth: 0 }}>
        {column.map(({ category, color, entries, done }) => {
          // A match inside a folded section would be invisible, so a
          // search opens everything for as long as it lasts.
          const open = searching ? true : (sectionOpen[category.id] ?? !done)

          return (
          <Box
            key={category.id}
            sx={{
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
            <Stack
              direction="row"
              sx={{ alignItems: 'center', gap: 1, cursor: 'pointer' }}
              onClick={() =>
                setSectionOpen((previous) => ({ ...previous, [category.id]: !open }))
              }
            >
              <IconButton
                size="small"
                sx={{ p: 0.25 }}
                aria-label={category.name}
                aria-expanded={open}
              >
                {open ? (
                  <ExpandMoreIcon fontSize="small" />
                ) : (
                  <ChevronRightIcon fontSize="small" />
                )}
              </IconButton>
              {category.isPerson && (
                <PersonOutlineIcon fontSize="small" sx={{ color: color, flexShrink: 0 }} />
              )}
              {editingSection?.id === category.id ? (
                <TextField
                  size="small"
                  variant="standard"
                  autoFocus
                  fullWidth
                  value={editingSection.name}
                  // The header folds the section when clicked; this is a
                  // control sitting inside it.
                  onClick={(event) => event.stopPropagation()}
                  onChange={(event) =>
                    setEditingSection({ id: category.id, name: event.target.value })
                  }
                  onBlur={commitSectionEdit}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') commitSectionEdit()
                    // Escape abandons the change; blur would otherwise
                    // commit it on the way out.
                    if (event.key === 'Escape') setEditingSection(null)
                  }}
                  sx={{ flexGrow: 1 }}
                />
              ) : (
                <Typography
                  variant="subtitle2"
                  // Renaming works the way items do: click the words.
                  // The chevron and the rest of the row still fold it.
                  onClick={(event) => {
                    event.stopPropagation()
                    setEditingSection({ id: category.id, name: category.name })
                  }}
                  sx={{
                    flexGrow: 1,
                    cursor: 'text',
                    opacity: done ? 0.7 : 1,
                    textTransform: 'uppercase',
                    letterSpacing: '1.1px',
                  }}
                >
                  {category.name}
                </Typography>
              )}
              {category.personId && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={categories.find((row) => row.id === category.personId)?.name ?? ''}
                  sx={{ height: 20, fontSize: 11 }}
                />
              )}
              <Tooltip title={t('travel.removeSection')}>
                <IconButton
                  size="small"
                  sx={{ p: 0.25 }}
                  aria-label={t('travel.removeSection')}
                  onClick={(event) => {
                    // Header clicks fold the section; this is a control
                    // sitting inside it.
                    event.stopPropagation()
                    removeSection(category, entries.length)
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Chip
                size="small"
                variant="outlined"
                label={`${entries.filter((item) => item.packed).length}/${entries.length}`}
              />
              <Tooltip title={t('travel.sectionActions')}>
                <IconButton
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation()
                    setMenu({ anchor: event.currentTarget, categoryId: category.id })
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>

            <Collapse in={open} unmountOnExit>
            {entries.map((item) => (
              <Stack key={item.id} direction="row" sx={{ alignItems: 'center', ...ROW_HOVER }}>
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
                {editingItem?.id === item.id ? (
                  <TextField
                    size="small"
                    variant="standard"
                    autoFocus
                    fullWidth
                    value={editingItem.text}
                    onChange={(event) =>
                      setEditingItem({ id: item.id, text: event.target.value })
                    }
                    onBlur={commitItemEdit}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') commitItemEdit()
                      // Escape abandons the change; blur would otherwise
                      // commit it on the way out.
                      if (event.key === 'Escape') setEditingItem(null)
                    }}
                    sx={{ flexGrow: 1 }}
                  />
                ) : (
                  <Typography
                    variant="body2"
                    onClick={() => setEditingItem({ id: item.id, text: item.text })}
                    sx={{
                      flexGrow: 1,
                      cursor: 'text',
                      textTransform: 'lowercase',
                      letterSpacing: '1.25px',
                      textDecoration: item.packed ? 'line-through' : 'none',
                      color: item.packed ? 'text.disabled' : 'text.primary',
                    }}
                  >
                    {item.text}
                  </Typography>
                )}
                {newToDefaultIds.has(item.id) && (
                  <Tooltip title={t('travel.keepThisInDefault')}>
                    <IconButton
                      size="small"
                      sx={{ p: 0.5 }}
                      aria-label={t('travel.keepThisInDefault')}
                      onClick={() => keepOne(item)}
                    >
                      <BookmarkAddOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
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
        ))}
        </Box>

        {sections.loose.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {t('travel.uncategorised')}
            </Typography>
            {sections.loose.map((item) => (
              <Stack key={item.id} direction="row" sx={{ alignItems: 'center', ...ROW_HOVER }}>
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
                  sx={{ flexGrow: 1, textTransform: 'lowercase', letterSpacing: '1.25px' }}
                >
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

        <Footer />
      </Paper>

      <Dialog open={confirmRemove !== null} onClose={() => setConfirmRemove(null)}>
        <DialogTitle>{t('travel.removeSectionTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {/* Says which of the two it is: one loses the items for
                good, the other only loses this trip's work on them. */}
            {t(
              confirmRemove &&
                templateItems.some((item) => item.categoryId === confirmRemove.id)
                ? 'travel.removeSectionBodyInDefault'
                : 'travel.removeSectionBody',
              { name: confirmRemove?.name ?? '' },
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRemove(null)}>{t('travel.cancel')}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              const category = confirmRemove
              setConfirmRemove(null)
              if (category && tripId) {
                void run(() => removeCategoryFromTrip(tripId, category.id))
              }
            }}
          >
            {t('travel.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sharing. The link carries the token, so handing it to someone is
          the whole of granting access — and clearing the token is the
          only way to take it back, which the wording says plainly. */}
      <Dialog
        open={sharing}
        onClose={() => {
          setSharing(false)
          setCopied(false)
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{t('travel.share')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t('travel.shareExplainer')}
          </Typography>

          {trip?.shareToken ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <TextField
                size="small"
                fullWidth
                value={shareUrl}
                slotProps={{ htmlInput: { readOnly: true } }}
                onFocus={(event) => event.target.select()}
              />
              <Tooltip title={copied ? t('travel.shareCopied') : t('travel.shareCopy')}>
                <IconButton
                  aria-label={t('travel.shareCopy')}
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(shareUrl)
                      .then(() => setCopied(true))
                      // Clipboard access can be refused; the field is
                      // readable and selectable either way.
                      .catch(() => setCopied(false))
                  }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          ) : (
            <Button
              variant="contained"
              startIcon={<IosShareIcon />}
              onClick={() =>
                void run(async () => {
                  if (!tripId) return
                  await enableShare(tripId)
                  setCopied(false)
                })
              }
            >
              {t('travel.shareEnable')}
            </Button>
          )}
        </DialogContent>
        <DialogActions>
          {trip?.shareToken && (
            <Button
              color="error"
              onClick={() =>
                void run(async () => {
                  if (!tripId) return
                  await disableShare(tripId)
                  setCopied(false)
                })
              }
            >
              {t('travel.shareDisable')}
            </Button>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Button
            onClick={() => {
              setSharing(false)
              setCopied(false)
            }}
          >
            {t('travel.close')}
          </Button>
        </DialogActions>
      </Dialog>

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
        open={addSectionMenu !== null}
        anchorEl={addSectionMenu}
        onClose={() => setAddSectionMenu(null)}
      >
        {/* Everything at once, for the start of a trip when the answer
            is almost always "all of it". Sections stay below for the
            times it is not. */}
        {defaultOnlySections.length > 1 && [
          <MenuItem
            key="all"
            onClick={() => {
              setAddSectionMenu(null)
              if (!tripId) return
              const rows = defaultOnlySections.flatMap(({ category, rows: items }) =>
                items.map((item) => ({ text: item.text, categoryId: category.id })),
              )
              void run(() => addItems(tripId, rows))
            }}
          >
            <PlaylistAddIcon fontSize="small" sx={{ mr: 1.5 }} />
            {t('travel.addAllFromDefault')}
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {defaultOnlySections.reduce((total, { rows }) => total + rows.length, 0)}
            </Typography>
          </MenuItem>,
          <Divider key="all-divider" />,
        ]}
        {defaultOnlySections.map(({ category, rows }) => (
          <MenuItem
            key={category.id}
            onClick={() => {
              setAddSectionMenu(null)
              if (tripId) {
                void run(() =>
                  addItems(
                    tripId,
                    rows.map((row) => ({ text: row.text, categoryId: category.id })),
                  ),
                )
              }
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: category.color ?? 'text.disabled',
                mr: 1.5,
                flexShrink: 0,
              }}
            />
            {category.name}
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {rows.length}
            </Typography>
          </MenuItem>
        ))}
      </Menu>

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
        {menu && templateId && (
          <MenuItem
            disabled={(newToDefault.get(menu.categoryId)?.length ?? 0) === 0}
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
            {(newToDefault.get(menu.categoryId)?.length ?? 0) === 0
              ? t('travel.keepInDefaultNone')
              : t('travel.keepInDefault', {
                  count: newToDefault.get(menu.categoryId)?.length ?? 0,
                })}
          </MenuItem>
        )}

        {menu && templateId && (
          <MenuItem
            disabled={(missingFromTrip.get(menu.categoryId)?.length ?? 0) === 0}
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
            {(missingFromTrip.get(menu.categoryId)?.length ?? 0) === 0
              ? t('travel.refillFromDefaultNone')
              : t('travel.refillFromDefault', {
                  count: missingFromTrip.get(menu.categoryId)?.length ?? 0,
                })}
          </MenuItem>
        )}

        {people.length > 0 &&
          menu &&
          !categories.find((row) => row.id === menu.categoryId)?.isPerson && [
            <MenuItem key="whose" disabled sx={{ opacity: 1 }}>
              <PersonOutlineIcon fontSize="small" sx={{ mr: 1 }} />
              {t('travel.whose')}
            </MenuItem>,
            <MenuItem
              key="nobody"
              selected={!categories.find((row) => row.id === menu.categoryId)?.personId}
              onClick={() => {
                const categoryId = menu.categoryId
                setMenu(null)
                void run(() => updateCategory(categoryId, { personId: null }))
              }}
            >
              {t('travel.nobody')}
            </MenuItem>,
            ...people.map((person) => (
              <MenuItem
                key={person.id}
                selected={
                  categories.find((row) => row.id === menu.categoryId)?.personId === person.id
                }
                onClick={() => {
                  const categoryId = menu.categoryId
                  setMenu(null)
                  void run(() => updateCategory(categoryId, { personId: person.id }))
                }}
              >
                {person.name}
              </MenuItem>
            )),
            <Divider key="whose-end" />,
          ]}

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


      </Menu>
    </Container>
  )
}
