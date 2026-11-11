import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Paper from '@mui/material/Paper'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Seo from '../../components/Seo'
import Footer from '../../components/Footer'
import { todayIso } from '../../lib/formatDate'
import {
  createGoal,
  deleteGoal,
  getGoals,
  updateGoal,
  type Goal,
} from '../../lib/goals/db'
import {
  BUCKETS,
  buildTree,
  flatten,
  groupByBucket,
  type GoalNode,
} from '../../lib/goals/tree'
import GoalRow, { type RowActions } from './GoalRow'
import { indentFor } from './indent'

/**
 * Goals, each with a deadline, each splittable into smaller goals with
 * deadlines of their own.
 *
 * Behind <RequireAuth>, and the database enforces the same thing
 * independently (migration 0019) — guards in a client-side app are UX,
 * not security.
 *
 * Goals are grouped by how close the deadline is rather than listed
 * flat, because the question this page answers is "what is late", not
 * "what exists". A goal answers to the earliest deadline anywhere
 * beneath it, so something late at depth seven surfaces at the top
 * instead of staying folded away.
 */

const COLLAPSED_KEY = 'serudio_goals_collapsed'

function readCollapsed(): Set<string> {
  try {
    const raw = localStorage.getItem(COLLAPSED_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [])
  } catch {
    // Private browsing or unparseable storage: everything starts open,
    // which is the harmless direction to fail in.
    return new Set()
  }
}

function writeCollapsed(ids: Set<string>): void {
  try {
    localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...ids]))
  } catch {
    // Nothing useful to do; folds just will not survive a reload.
  }
}

export default function GoalsPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? i18n.language

  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  // Refetching after an edit must not blank the page out and read as a
  // blink — the same reason the travel pages keep this second flag.
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [collapsed, setCollapsed] = useState<Set<string>>(readCollapsed)
  const [draft, setDraft] = useState('')
  const [addingUnder, setAddingUnder] = useState<string | null>(null)
  const [stepDraft, setStepDraft] = useState('')
  const [dateFor, setDateFor] = useState<{ anchor: HTMLElement; node: GoalNode } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<GoalNode | null>(null)

  // Fixed for as long as the page is open. A list that re-bucketed
  // itself at midnight under a reader's hands would be worse than one
  // that waits for a reload.
  const today = useMemo(() => todayIso(), [])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setGoals(await getGoals())
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

  const roots = useMemo(() => buildTree(goals), [goals])
  const groups = useMemo(() => groupByBucket(roots, today), [roots, today])

  /** Applies locally, writes, and only reconciles when the write fails. */
  const optimistic = (apply: () => void, write: () => Promise<void>) => {
    apply()
    void write().catch((caught) => {
      setError(caught instanceof Error ? caught.message : String(caught))
      void refresh()
    })
  }

  const patch = (id: string, change: Partial<Goal>) =>
    setGoals((previous) =>
      previous.map((goal) => (goal.id === id ? { ...goal, ...change } : goal)),
    )

  const add = async (title: string, parentId: string | null) => {
    const text = title.trim()
    if (!text) return
    try {
      // The new row comes back from the insert rather than being
      // guessed at, so its id is real and the next click on it works.
      const siblings = goals.filter((goal) => goal.parentId === parentId)
      const created = await createGoal({
        title: text,
        parentId,
        sortOrder: siblings.reduce((max, goal) => Math.max(max, goal.sortOrder), -1) + 1,
      })
      setGoals((previous) => [...previous, created])
      // A goal folded shut would otherwise swallow the step just added
      // to it.
      if (parentId) {
        setCollapsed((previous) => {
          if (!previous.has(parentId)) return previous
          const next = new Set(previous)
          next.delete(parentId)
          writeCollapsed(next)
          return next
        })
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    }
  }

  const actions: RowActions = {
    toggleCollapse: (id) =>
      setCollapsed((previous) => {
        const next = new Set(previous)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        writeCollapsed(next)
        return next
      }),

    toggleDone: (goal) => {
      const doneAt = goal.doneAt ? null : new Date().toISOString()
      optimistic(
        () => patch(goal.id, { doneAt }),
        () => updateGoal(goal.id, { doneAt }),
      )
    },

    rename: (id, title) =>
      optimistic(
        () => patch(id, { title }),
        () => updateGoal(id, { title }),
      ),

    openDate: (anchor, node) => setDateFor({ anchor, node }),

    addStep: (id) => {
      setAddingUnder(id)
      setStepDraft('')
    },

    remove: (node) => setConfirmDelete(node),
  }

  const setDue = (id: string, dueOn: string | null) => {
    optimistic(
      () => patch(id, { dueOn }),
      () => updateGoal(id, { dueOn }),
    )
    setDateFor(null)
  }

  const handleDelete = () => {
    const node = confirmDelete
    setConfirmDelete(null)
    if (!node) return

    const gone = new Set<string>()
    const collect = (current: GoalNode) => {
      gone.add(current.goal.id)
      current.children.forEach(collect)
    }
    collect(node)

    optimistic(
      () => setGoals((previous) => previous.filter((goal) => !gone.has(goal.id))),
      () => deleteGoal(node.goal.id),
    )
  }

  if (loading && !loaded) {
    return (
      <Container maxWidth="sm" disableGutters>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="sm" disableGutters>
      {/* noindex: one account's private list is not a search result. */}
      <Seo title={t('goals.seoTitle')} description={t('goals.seoDescription')} path="/goals" noIndex />
      <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Typography
          variant="h5"
          component="h1"
          sx={{ textTransform: 'uppercase', letterSpacing: '1.2px', mb: 2 }}
        >
          {t('goals.title')}
        </Typography>

        <TextField
          fullWidth
          size="small"
          value={draft}
          placeholder={t('goals.addPlaceholder')}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            void add(draft, null)
            setDraft('')
          }}
          sx={{ mb: 3 }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {goals.length === 0 && !error && (
          <Typography variant="body2" color="text.secondary">
            {t('goals.empty')}
          </Typography>
        )}

        {BUCKETS.map((bucket) => {
          const rows = flatten(groups[bucket], collapsed)
          if (rows.length === 0) return null

          return (
            <Box key={bucket} sx={{ mb: 3 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mb: 0.75,
                  textTransform: 'uppercase',
                  letterSpacing: '1.1px',
                  fontWeight: 700,
                  color: bucket === 'overdue' ? 'error.main' : 'text.secondary',
                }}
              >
                {t(`goals.buckets.${bucket}`)}
              </Typography>

              {rows.map((node) => (
                <Box key={node.goal.id}>
                  <GoalRow
                    node={node}
                    today={today}
                    locale={locale}
                    collapsed={collapsed.has(node.goal.id)}
                    actions={actions}
                  />

                  {addingUnder === node.goal.id && (
                    <Box sx={{ ml: `${indentFor(node.depth + 1) + 28}px`, py: 0.5 }}>
                      <TextField
                        size="small"
                        variant="standard"
                        autoFocus
                        fullWidth
                        value={stepDraft}
                        placeholder={t('goals.addStepPlaceholder')}
                        onChange={(event) => setStepDraft(event.target.value)}
                        onBlur={() => setAddingUnder(null)}
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') setAddingUnder(null)
                          if (event.key !== 'Enter') return
                          void add(stepDraft, node.goal.id)
                          // Stays open: splitting a goal up is usually
                          // several steps in a row, not one.
                          setStepDraft('')
                        }}
                      />
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          )
        })}

        <Popover
          open={dateFor !== null}
          anchorEl={dateFor?.anchor ?? null}
          onClose={() => setDateFor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Stack sx={{ p: 1.5, gap: 1 }}>
            <TextField
              type="date"
              size="small"
              autoFocus
              label={t('goals.deadline')}
              InputLabelProps={{ shrink: true }}
              value={dateFor?.node.goal.dueOn ?? ''}
              onChange={(event) =>
                dateFor && setDue(dateFor.node.goal.id, event.target.value || null)
              }
            />
            {dateFor?.node.goal.dueOn && (
              <Button size="small" onClick={() => setDue(dateFor.node.goal.id, null)}>
                {t('goals.clearDeadline')}
              </Button>
            )}
          </Stack>
        </Popover>

        <Dialog open={confirmDelete !== null} onClose={() => setConfirmDelete(null)}>
          <DialogTitle>{t('goals.deleteTitle')}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {/* Says how much goes with it: deleting a goal takes
                  everything nested under it, which is not obvious from a
                  row that is folded shut. */}
              {confirmDelete && confirmDelete.total > 0
                ? t('goals.deleteBodySteps', {
                    title: confirmDelete.goal.title,
                    count: confirmDelete.total,
                  })
                : t('goals.deleteBody', { title: confirmDelete?.goal.title ?? '' })}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDelete(null)}>{t('goals.cancel')}</Button>
            <Button color="error" onClick={handleDelete}>
              {t('goals.confirmDelete')}
            </Button>
          </DialogActions>
        </Dialog>

        <Footer />
      </Paper>
    </Container>
  )
}
