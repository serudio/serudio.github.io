import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import FormControlLabel from '@mui/material/FormControlLabel'
import ListItemButton from '@mui/material/ListItemButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import TuneIcon from '@mui/icons-material/Tune'
import Seo from '../../components/Seo'
import Footer from '../../components/Footer'
import { useDeclarePageChrome } from '../../components/pageChrome'
import { todayIso } from '../../lib/formatDate'
import {
  addSets,
  clearCell,
  copySets,
  createExercise,
  deleteExercise,
  getExercises,
  getYear,
  getYearTotals,
  setCell,
  type Exercise,
  type WorkoutSet,
  type YearTotal,
} from '../../lib/workouts/db'
import { nextSlot, repsOf } from '../../lib/workouts/grid'
import YearGrid, { type GridActions } from './YearGrid'

/**
 * Workouts: every set, laid out the way the records were already kept.
 *
 * Behind <RequireAuth>, and migration 0020 scopes both tables to
 * auth.uid() independently — guards in a client-side app are UX, not
 * security.
 *
 * The current year is always open. Past years are one line each until
 * opened, and opening one is what fetches it: three sets a day is about
 * a thousand rows a year, so loading every year on every visit would
 * cost more with each year of use.
 */

const yearOf = (date: string) => Number(date.slice(0, 4))

const VIEW_KEY = 'serudio_workouts_view'

interface View {
  /** Days with nothing on them are dropped from the grid. */
  hideEmpty: boolean
  /** Exercises whose columns are not drawn, by id. */
  hidden: string[]
  /**
   * Months the reader has folded or unfolded by hand, "2026-10" -> open.
   *
   * Only the exceptions are kept. Everything else follows the rule
   * below — the month in progress is open, the ones behind it are shut —
   * so a stored choice never has to be rewritten as time passes.
   */
  months: Record<string, boolean>
}

function readView(): View {
  try {
    const raw = localStorage.getItem(VIEW_KEY)
    if (!raw) return { hideEmpty: false, hidden: [], months: {} }
    const parsed = JSON.parse(raw) as Partial<View>
    return {
      hideEmpty: parsed.hideEmpty === true,
      hidden: Array.isArray(parsed.hidden)
        ? parsed.hidden.filter((id) => typeof id === 'string')
        : [],
      months:
        parsed.months && typeof parsed.months === 'object' ? parsed.months : {},
    }
  } catch {
    // Private browsing or unparseable storage: show everything, which
    // is the harmless direction to fail in.
    return { hideEmpty: false, hidden: [], months: {} }
  }
}

function writeView(view: View): void {
  try {
    localStorage.setItem(VIEW_KEY, JSON.stringify(view))
  } catch {
    // Nothing useful to do; the choice just will not survive a reload.
  }
}

export default function WorkoutsPage() {
  const { t } = useTranslation()
  useDeclarePageChrome({ width: 'xl' })

  const today = useMemo(() => todayIso(), [])
  const currentYear = yearOf(today)

  const [exercises, setExercises] = useState<Exercise[]>([])
  const [totals, setTotals] = useState<YearTotal[]>([])
  const [byYear, setByYear] = useState<Record<number, WorkoutSet[]>>({})
  const [open, setOpen] = useState<number[]>([currentYear])
  const [busyYear, setBusyYear] = useState<number | null>(null)

  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [pickedExercise, setPickedExercise] = useState('')
  const [reps, setReps] = useState('')
  const [count, setCount] = useState('1')
  const [newExercise, setNewExercise] = useState('')
  const [managing, setManaging] = useState(false)
  const [removing, setRemoving] = useState<Exercise | null>(null)

  const [view, setView] = useState<View>(readView)

  const [dayMenu, setDayMenu] = useState<
    { anchor: HTMLElement; day: string; exerciseId: string } | null
  >(null)
  const [copyFrom, setCopyFrom] = useState<{ day: string; exerciseId: string } | null>(null)

  const fail = useCallback((caught: unknown) => {
    setError(caught instanceof Error ? caught.message : String(caught))
  }, [])

  useEffect(() => {
    void (async () => {
      try {
        const [list, years, thisYear] = await Promise.all([
          getExercises(),
          getYearTotals(),
          getYear(currentYear),
        ])
        setExercises(list)
        setTotals(years)
        setByYear({ [currentYear]: thisYear })
        setPickedExercise((previous) => previous || list[0]?.id || '')
        setError(null)
      } catch (caught) {
        fail(caught)
      } finally {
        setLoading(false)
        setLoaded(true)
      }
    })()
  }, [currentYear, fail])

  const openYear = async (year: number) => {
    if (open.includes(year)) {
      setOpen((previous) => previous.filter((value) => value !== year))
      return
    }
    setOpen((previous) => [...previous, year])
    if (byYear[year]) return

    setBusyYear(year)
    try {
      const rows = await getYear(year)
      setByYear((previous) => ({ ...previous, [year]: rows }))
    } catch (caught) {
      fail(caught)
    } finally {
      setBusyYear(null)
    }
  }

  /** Puts rows into the bucket for the year they fall in. */
  const absorb = (rows: WorkoutSet[]) =>
    setByYear((previous) => {
      const next = { ...previous }
      for (const row of rows) {
        const year = yearOf(row.doneOn)
        if (!next[year]) continue
        next[year] = [...next[year].filter((set) => set.id !== row.id), row]
      }
      return next
    })

  const setsFor = (year: number) => byYear[year] ?? []

  const actions: GridActions = {
    write: (day, exerciseId, slot, value) => {
      void setCell({ exerciseId, doneOn: day, slot, reps: value })
        .then((row) => absorb([row]))
        .catch(fail)
    },

    clear: (set) => {
      setByYear((previous) => {
        const year = yearOf(set.doneOn)
        if (!previous[year]) return previous
        return { ...previous, [year]: previous[year].filter((row) => row.id !== set.id) }
      })
      void clearCell(set.id).catch(fail)
    },

    openDayMenu: (anchor, day, exerciseId) => setDayMenu({ anchor, day, exerciseId }),
  }

  const handleQuickAdd = async () => {
    const value = Number.parseInt(reps, 10)
    const times = Math.max(1, Number.parseInt(count, 10) || 1)
    if (!pickedExercise || !Number.isFinite(value) || value <= 0) return

    try {
      const rows = await addSets({
        exerciseId: pickedExercise,
        doneOn: today,
        reps: value,
        count: times,
        firstSlot: nextSlot(setsFor(currentYear), pickedExercise, today),
      })
      absorb(rows)
      setReps('')
    } catch (caught) {
      fail(caught)
    }
  }

  /** Both copies are the same move: these reps, somewhere else. */
  const copy = async (toExerciseId: string, toDay: string) => {
    const source = copyFrom ?? dayMenu
    if (!source) return
    setDayMenu(null)
    setCopyFrom(null)

    const reading = repsOf(setsFor(yearOf(source.day)), source.exerciseId, source.day)
    if (reading.length === 0) return

    try {
      const rows = await copySets({
        reps: reading,
        toExerciseId,
        toDay,
        firstSlot: nextSlot(setsFor(yearOf(toDay)), toExerciseId, toDay),
      })
      // Copying into a year that is not open has nowhere to land on
      // screen; opening it is what fetches it.
      if (!byYear[yearOf(toDay)]) await openYear(yearOf(toDay))
      else absorb(rows)
    } catch (caught) {
      fail(caught)
    }
  }

  const handleAddExercise = async () => {
    const name = newExercise.trim()
    if (!name) return
    try {
      const created = await createExercise(name, exercises.length)
      setExercises((previous) => [...previous, created])
      setPickedExercise((previous) => previous || created.id)
      setNewExercise('')
    } catch (caught) {
      fail(caught)
    }
  }

  const handleRemoveExercise = async () => {
    const target = removing
    setRemoving(null)
    if (!target) return
    try {
      await deleteExercise(target.id)
      setExercises((previous) => previous.filter((row) => row.id !== target.id))
      setByYear((previous) =>
        Object.fromEntries(
          Object.entries(previous).map(([year, rows]) => [
            year,
            rows.filter((row) => row.exerciseId !== target.id),
          ]),
        ),
      )
      setTotals(await getYearTotals())
    } catch (caught) {
      fail(caught)
    }
  }

  const setsOfExercise = (exercise: Exercise) =>
    Object.values(byYear).flat().filter((row) => row.exerciseId === exercise.id).length

  const updateView = (change: Partial<View>) =>
    setView((previous) => {
      const next = { ...previous, ...change }
      writeView(next)
      return next
    })

  /**
   * The columns actually drawn. Every total in the grid is over these,
   * so filtering down to two exercises gives their combined figures
   * rather than the whole day's.
   */
  const shown = exercises.filter((exercise) => !view.hidden.includes(exercise.id))

  const currentMonth = Number(today.slice(5, 7))
  const monthKey = (year: number, month: number) => `${year}-${String(month).padStart(2, '0')}`

  /**
   * The month being trained in is open; everything behind it is folded.
   *
   * A year is twelve blocks of thirty rows, and eleven of them are
   * finished business — the totals on the closed header say what
   * happened in each, which is what a past month is consulted for.
   */
  const isMonthOpen = (year: number, month: number) => {
    const stored = view.months[monthKey(year, month)]
    if (stored !== undefined) return stored
    return year === currentYear && month === currentMonth
  }

  const toggleMonth = (year: number, month: number) =>
    updateView({
      months: { ...view.months, [monthKey(year, month)]: !isMonthOpen(year, month) },
    })

  const pastYears = totals.filter((row) => row.year !== currentYear)

  if (loading && !loaded) {
    return (
      <Container maxWidth="xl" disableGutters>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" disableGutters>
      {/* noindex: one account's training log is not a search result. */}
      <Seo
        title={t('workouts.seoTitle')}
        description={t('workouts.seoDescription')}
        path="/workouts"
        noIndex
      />
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 2 }}>
          <Typography
            variant="h5"
            component="h1"
            sx={{ textTransform: 'uppercase', letterSpacing: '1.2px', flexGrow: 1 }}
          >
            {t('workouts.title')}
          </Typography>
          <Tooltip title={t('workouts.manage')}>
            <IconButton size="small" onClick={() => setManaging(true)} aria-label={t('workouts.manage')}>
              <TuneIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {exercises.length === 0 ? (
          <Stack direction="row" sx={{ gap: 1, alignItems: 'center', mb: 3 }}>
            <TextField
              size="small"
              value={newExercise}
              placeholder={t('workouts.newExercise')}
              onChange={(event) => setNewExercise(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && void handleAddExercise()}
            />
            <Button size="small" variant="contained" onClick={() => void handleAddExercise()}>
              {t('workouts.addExercise')}
            </Button>
          </Stack>
        ) : (
          <Stack
            direction="row"
            useFlexGap
            flexWrap="wrap"
            sx={{ gap: 1, alignItems: 'center', mb: 3 }}
          >
            <TextField
              select
              size="small"
              value={pickedExercise}
              onChange={(event) => setPickedExercise(event.target.value)}
              sx={{ minWidth: 150 }}
            >
              {exercises.map((exercise) => (
                <MenuItem key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              size="small"
              type="number"
              value={reps}
              label={t('workouts.reps')}
              sx={{ width: 100 }}
              onChange={(event) => setReps(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && void handleQuickAdd()}
            />
            <TextField
              size="small"
              type="number"
              value={count}
              label={t('workouts.sets')}
              sx={{ width: 90 }}
              onChange={(event) => setCount(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && void handleQuickAdd()}
            />
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => void handleQuickAdd()}
            >
              {t('workouts.add')}
            </Button>
          </Stack>
        )}

        {exercises.length > 0 && (
          <Stack
            direction="row"
            useFlexGap
            flexWrap="wrap"
            sx={{ gap: 1, alignItems: 'center', mb: 2 }}
          >
            {exercises.map((exercise) => {
              const on = !view.hidden.includes(exercise.id)
              return (
                <Chip
                  key={exercise.id}
                  size="small"
                  label={exercise.name}
                  variant={on ? 'filled' : 'outlined'}
                  color={on ? 'primary' : 'default'}
                  onClick={() =>
                    updateView({
                      hidden: on
                        ? [...view.hidden, exercise.id]
                        : view.hidden.filter((id) => id !== exercise.id),
                    })
                  }
                  sx={{ textTransform: 'lowercase', letterSpacing: '1.1px' }}
                />
              )
            })}
            <Box sx={{ flexGrow: 1 }} />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={view.hideEmpty}
                  onChange={(event) => updateView({ hideEmpty: event.target.checked })}
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  {t('workouts.hideEmptyDays')}
                </Typography>
              }
            />
          </Stack>
        )}

        {open.includes(currentYear) && (
          <YearGrid
            year={currentYear}
            exercises={shown}
            sets={setsFor(currentYear)}
            today={today}
            actions={actions}
            scrollToToday={loaded}
            hideEmpty={view.hideEmpty}
            isMonthOpen={isMonthOpen}
            onToggleMonth={toggleMonth}
          />
        )}

        {pastYears.map((row) => (
          <Box key={row.year} sx={{ mb: 2 }}>
            <ListItemButton onClick={() => void openYear(row.year)} sx={{ borderRadius: 1 }}>
              {open.includes(row.year) ? (
                <ExpandMoreIcon fontSize="small" sx={{ mr: 1 }} />
              ) : (
                <ChevronRightIcon fontSize="small" sx={{ mr: 1 }} />
              )}
              <Typography sx={{ fontWeight: 700, mr: 2 }}>{row.year}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('workouts.yearSummary', { reps: row.reps, sets: row.sets })}
              </Typography>
            </ListItemButton>

            {busyYear === row.year && <CircularProgress size={18} sx={{ m: 2 }} />}

            {open.includes(row.year) && byYear[row.year] && (
              <YearGrid
                year={row.year}
                exercises={shown}
                sets={setsFor(row.year)}
                today={today}
                actions={actions}
                hideEmpty={view.hideEmpty}
                isMonthOpen={isMonthOpen}
                onToggleMonth={toggleMonth}
              />
            )}
          </Box>
        ))}

        <Menu
          open={dayMenu !== null}
          anchorEl={dayMenu?.anchor ?? null}
          onClose={() => setDayMenu(null)}
        >
          <MenuItem
            onClick={() => {
              setCopyFrom(dayMenu ? { day: dayMenu.day, exerciseId: dayMenu.exerciseId } : null)
              setDayMenu(null)
            }}
          >
            {t('workouts.copyTo')}
          </MenuItem>
          {dayMenu?.day !== today && (
            <MenuItem onClick={() => void copy(dayMenu!.exerciseId, today)}>
              {t('workouts.repeatToday')}
            </MenuItem>
          )}
        </Menu>

        <Dialog open={copyFrom !== null} onClose={() => setCopyFrom(null)}>
          <DialogTitle>{t('workouts.copyToTitle')}</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 1 }}>
              {t('workouts.copyToBody', {
                reps: copyFrom
                  ? repsOf(setsFor(yearOf(copyFrom.day)), copyFrom.exerciseId, copyFrom.day).join(', ')
                  : '',
              })}
            </DialogContentText>
            <Stack>
              {exercises
                .filter((exercise) => exercise.id !== copyFrom?.exerciseId)
                .map((exercise) => (
                  <ListItemButton
                    key={exercise.id}
                    onClick={() => void copy(exercise.id, copyFrom!.day)}
                  >
                    {exercise.name}
                  </ListItemButton>
                ))}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCopyFrom(null)}>{t('workouts.cancel')}</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={managing} onClose={() => setManaging(false)} fullWidth maxWidth="xs">
          <DialogTitle>{t('workouts.manage')}</DialogTitle>
          <DialogContent>
            <Stack sx={{ gap: 1, mt: 1 }}>
              {exercises.map((exercise) => (
                <Stack
                  key={exercise.id}
                  direction="row"
                  sx={{ alignItems: 'center', gap: 1 }}
                >
                  <Typography sx={{ flexGrow: 1 }}>{exercise.name}</Typography>
                  <Button size="small" color="error" onClick={() => setRemoving(exercise)}>
                    {t('workouts.delete')}
                  </Button>
                </Stack>
              ))}
              <Stack direction="row" sx={{ gap: 1, mt: 1 }}>
                <TextField
                  size="small"
                  fullWidth
                  value={newExercise}
                  placeholder={t('workouts.newExercise')}
                  onChange={(event) => setNewExercise(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && void handleAddExercise()}
                />
                <Button size="small" onClick={() => void handleAddExercise()}>
                  {t('workouts.addExercise')}
                </Button>
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setManaging(false)}>{t('workouts.close')}</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={removing !== null} onClose={() => setRemoving(null)}>
          <DialogTitle>{t('workouts.deleteExerciseTitle')}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {/* Says what goes with it: every set ever recorded under
                  that name, which a list of names does not show. */}
              {t('workouts.deleteExerciseBody', {
                name: removing?.name ?? '',
                count: removing ? setsOfExercise(removing) : 0,
              })}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRemoving(null)}>{t('workouts.cancel')}</Button>
            <Button color="error" onClick={() => void handleRemoveExercise()}>
              {t('workouts.delete')}
            </Button>
          </DialogActions>
        </Dialog>

        <Footer />
      </Paper>
    </Container>
  )
}
