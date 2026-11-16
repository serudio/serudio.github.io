import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DownloadIcon from '@mui/icons-material/Download'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import RemoveIcon from '@mui/icons-material/Remove'
import AddIcon from '@mui/icons-material/Add'
import { alpha, useTheme } from '@mui/material/styles'
import Seo from '../../components/Seo'
import Footer from '../../components/Footer'
import {
  MAX_WEIGHT,
  MIN_WEIGHT,
  createItem,
  deleteItem,
  getItems,
  updateItem,
  type TodoItem,
} from '../../lib/todo/db'
import { buildTodoExport } from '../../lib/todo/exportWorkbook'
import { downloadWorkbook } from '../../lib/xlsx'
import { todayIso } from '../../lib/formatDate'
import TodoPill from './TodoPill'
import { PALETTE, colorOf, nextColor } from './colors'

/**
 * "100 todo": the things to do one day, written on one wall.
 *
 * Behind <RequireAuth>, and the database enforces the same thing
 * independently (migration 0022) — guards in a client-side app are UX,
 * not security.
 *
 * Size carries the meaning here. There is no priority field and no
 * sorting: an item matters as much as it is big, which is a judgement
 * made by hand and read at a glance, and that is the whole point of
 * laying the list out this way rather than as rows.
 *
 * Order is the order things were added, never shuffled. A wall that
 * rearranged itself on every load would be unreadable — you find an
 * item by remembering where it sits.
 */

export default function TodoPage() {
  const { t } = useTranslation()
  const theme = useTheme()
  const mode = theme.palette.mode === 'light' ? 'light' : 'dark'

  const [items, setItems] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  // Refetching after an edit must not blank the page out and read as a
  // blink — the same reason the goals and travel pages keep this flag.
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [nameDraft, setNameDraft] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [exporting, setExporting] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await getItems())
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setLoading(false)
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Read from state rather than captured at open time, so the popover
  // shows the size and colour being chosen inside it.
  const editing = useMemo(
    () => items.find((item) => item.id === editingId) ?? null,
    [items, editingId],
  )

  /** Applies locally, writes, and only reconciles when the write fails. */
  const optimistic = (apply: () => void, write: () => Promise<void>) => {
    apply()
    void write().catch((caught) => {
      setError(caught instanceof Error ? caught.message : String(caught))
      void refresh()
    })
  }

  const patch = (id: string, change: Partial<TodoItem>) =>
    setItems((previous) =>
      previous.map((item) => (item.id === id ? { ...item, ...change } : item)),
    )

  const add = async () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    try {
      // The new row comes back from the insert rather than being guessed
      // at, so its id is real and the first click on it works.
      const created = await createItem({
        text,
        // Smallest. A new item has not earned its size yet, and growing
        // the few that matter is less work than shrinking the rest.
        weight: MIN_WEIGHT,
        color: nextColor(items),
        // One below the lowest, so it lands at the front without
        // renumbering everything behind it. The alternative — bumping
        // every other row by one — is a write per item on every add,
        // and any one of them failing leaves the wall in an order
        // neither the page nor the database meant.
        sortOrder: items.reduce((min, item) => Math.min(min, item.sortOrder), 1) - 1,
      })
      setItems((previous) => [created, ...previous])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
      setDraft(text)
    }
  }

  const openEditor = (element: HTMLElement, item: TodoItem) => {
    setAnchor(element)
    setEditingId(item.id)
    setNameDraft(item.text)
    setConfirming(false)
  }

  /** Commits whatever the name field holds, then lets go of the popover. */
  const closeEditor = () => {
    const item = editing
    const text = nameDraft.trim()
    if (item && text && text !== item.text) {
      optimistic(
        () => patch(item.id, { text }),
        () => updateItem(item.id, { text }),
      )
    }
    setEditingId(null)
    setAnchor(null)
    setConfirming(false)
  }

  const resize = (item: TodoItem, by: number) => {
    const weight = Math.min(Math.max(item.weight + by, MIN_WEIGHT), MAX_WEIGHT)
    if (weight === item.weight) return
    optimistic(
      () => patch(item.id, { weight }),
      () => updateItem(item.id, { weight }),
    )
  }

  const toggleDone = (item: TodoItem) => {
    const doneAt = item.doneAt ? null : new Date().toISOString()
    optimistic(
      () => patch(item.id, { doneAt }),
      () => updateItem(item.id, { doneAt }),
    )
  }

  const recolor = (item: TodoItem, color: number) =>
    optimistic(
      () => patch(item.id, { color }),
      () => updateItem(item.id, { color }),
    )

  const remove = (item: TodoItem) => {
    setEditingId(null)
    setAnchor(null)
    setConfirming(false)
    optimistic(
      () => setItems((previous) => previous.filter((other) => other.id !== item.id)),
      () => deleteItem(item.id),
    )
  }

  /**
   * The list as a spreadsheet.
   *
   * Exports what is in hand, which here is the whole list: this page
   * loads every item in one query and draws all of them, so there is no
   * filtered or folded state for a file to quietly leave out.
   */
  const handleExport = () => {
    setExporting(true)
    try {
      const sheets = buildTodoExport(
        items,
        {
          title: t('todo.title'),
          count: t('todo.count'),
          item: t('todo.columnItem'),
          size: t('todo.size'),
          color: t('todo.columnColor'),
          done: t('todo.columnDone'),
        },
        (index) => t(`todo.colors.${(PALETTE[index] ?? PALETTE[0]).key}`),
      )
      downloadWorkbook(sheets, `${t('todo.title').toLowerCase()}-${todayIso()}.xlsx`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setExporting(false)
    }
  }

  if (loading && !loaded) {
    return (
      <Container maxWidth="md" disableGutters>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" disableGutters>
      {/* noindex: one account's private list is not a search result. */}
      <Seo
        title={t('todo.seoTitle')}
        description={t('todo.seoDescription')}
        path="/100-todo"
        noIndex
      />
      <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack
          direction="row"
          sx={{ alignItems: 'baseline', mb: 2, gap: 1.5 }}
        >
          <Typography
            variant="h5"
            component="h1"
            sx={{ textTransform: 'uppercase', letterSpacing: '1.2px', flexGrow: 1 }}
          >
            {t('todo.title')}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            {items.length}
          </Typography>
          <Tooltip title={t('todo.exportHint')}>
            <span>
              <IconButton
                size="small"
                disabled={exporting || items.length === 0}
                onClick={handleExport}
                aria-label={t('todo.export')}
              >
                <DownloadIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        <TextField
          fullWidth
          size="small"
          value={draft}
          placeholder={t('todo.addPlaceholder')}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            void add()
          }}
          sx={{ mb: 3 }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {items.length === 0 && !error ? (
          <Typography variant="body2" color="text.secondary">
            {t('todo.empty')}
          </Typography>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              // Baseline, so items of different sizes sit on a common
              // line rather than floating at their own centres.
              alignItems: 'baseline',
              justifyContent: 'center',
              gap: 1.25,
              py: 1,
            }}
          >
            {items.map((item) => (
              <TodoPill
                key={item.id}
                item={item}
                selected={item.id === editingId}
                onOpen={openEditor}
              />
            ))}
          </Box>
        )}

        {/*
          One popover does everything to an item: rename, resize,
          recolour, remove. A hover toolbar would be unreachable on a
          phone, and four separate menus would be four things to find.
        */}
        <Popover
          open={editing !== null}
          anchorEl={anchor}
          onClose={closeEditor}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          {editing && (
            <Stack sx={{ p: 1.5, gap: 1.25, width: 268 }}>
              <TextField
                size="small"
                autoFocus
                fullWidth
                value={nameDraft}
                label={t('todo.rename')}
                onChange={(event) => setNameDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') closeEditor()
                  if (event.key === 'Escape') {
                    // Abandons the edit rather than committing it.
                    setNameDraft(editing.text)
                    setEditingId(null)
                    setAnchor(null)
                  }
                }}
              />

              {/* First in the popover: crossing something off is the
                  thing you came here to do most often. */}
              <Button
                size="small"
                variant={editing.doneAt ? 'contained' : 'outlined'}
                startIcon={
                  editing.doneAt ? (
                    <CheckCircleIcon fontSize="small" />
                  ) : (
                    <RadioButtonUncheckedIcon fontSize="small" />
                  )
                }
                onClick={() => toggleDone(editing)}
              >
                {t(editing.doneAt ? 'todo.markUndone' : 'todo.markDone')}
              </Button>

              <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
                  {t('todo.size')}
                </Typography>
                <Tooltip title={t('todo.smaller')}>
                  <span>
                    <IconButton
                      size="small"
                      disabled={editing.weight <= MIN_WEIGHT}
                      onClick={() => resize(editing, -1)}
                      aria-label={t('todo.smaller')}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Typography variant="body2" sx={{ width: 16, textAlign: 'center' }}>
                  {editing.weight}
                </Typography>
                <Tooltip title={t('todo.bigger')}>
                  <span>
                    <IconButton
                      size="small"
                      disabled={editing.weight >= MAX_WEIGHT}
                      onClick={() => resize(editing, 1)}
                      aria-label={t('todo.bigger')}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {PALETTE.map((entry, index) => {
                  const swatch = colorOf(index, mode)
                  const chosen = index === editing.color
                  return (
                    <Box
                      key={entry.key}
                      component="button"
                      type="button"
                      aria-label={t(`todo.colors.${entry.key}`)}
                      aria-pressed={chosen}
                      onClick={() => recolor(editing, index)}
                      sx={{
                        width: 26,
                        height: 26,
                        p: 0,
                        cursor: 'pointer',
                        borderRadius: '50%',
                        backgroundColor: swatch,
                        // The chosen one is ringed rather than ticked: a
                        // tick mark needs a contrasting colour of its
                        // own against eight different backgrounds.
                        border: chosen
                          ? `2px solid ${theme.palette.text.primary}`
                          : `1px solid ${alpha(swatch, 0.5)}`,
                        outlineOffset: 2,
                      }}
                    />
                  )
                })}
              </Box>

              <Divider />

              {/*
                Two steps, because there is no undo and the words are the
                only copy of the thought. A confirmation dialog on top of
                a popover would be a modal over a modal.
              */}
              {confirming ? (
                <Stack direction="row" sx={{ gap: 1 }}>
                  <Button size="small" sx={{ flexGrow: 1 }} onClick={() => setConfirming(false)}>
                    {t('todo.cancel')}
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="contained"
                    sx={{ flexGrow: 1 }}
                    onClick={() => remove(editing)}
                  >
                    {t('todo.confirmDelete')}
                  </Button>
                </Stack>
              ) : (
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteOutlineIcon fontSize="small" />}
                  onClick={() => setConfirming(true)}
                >
                  {t('todo.delete')}
                </Button>
              )}
            </Stack>
          )}
        </Popover>

        <Footer />
      </Paper>
    </Container>
  )
}
