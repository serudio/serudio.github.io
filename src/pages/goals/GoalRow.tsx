import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import EventOutlinedIcon from '@mui/icons-material/EventOutlined'
import { formatDateOnly } from '../../lib/formatDate'
import { MAX_GOAL_DEPTH, type Goal } from '../../lib/goals/db'
import type { GoalNode } from '../../lib/goals/tree'
import { indentFor } from './indent'

const ROW_HOVER = {
  borderRadius: 1,
  px: 0.5,
  transition: 'background-color 120ms',
  '&:hover': { bgcolor: 'action.hover' },
} as const

export interface RowActions {
  toggleCollapse(id: string): void
  toggleDone(goal: Goal): void
  rename(id: string, title: string): void
  openDate(anchor: HTMLElement, node: GoalNode): void
  addStep(id: string): void
  remove(node: GoalNode): void
}

function dueColor(due: string, today: string): string {
  if (due < today) return 'error.main'
  if (due === today) return 'warning.main'
  return 'text.secondary'
}

export default function GoalRow({
  node,
  today,
  locale,
  collapsed,
  actions,
}: {
  node: GoalNode
  today: string
  locale: string
  collapsed: boolean
  actions: RowActions
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<string | null>(null)

  const { goal, depth, children, done, total, earliestDue } = node
  const finished = Boolean(goal.doneAt)
  const hasChildren = children.length > 0

  /**
   * The deadline that is really pressing on this row while it is folded
   * shut. Shown only when it is not the row's own date, so a collapsed
   * goal never hides the fact that something inside it is late.
   */
  const hiddenDue =
    collapsed && earliestDue && earliestDue !== goal.dueOn ? earliestDue : null

  const commit = () => {
    const next = (draft ?? '').trim()
    if (next && next !== goal.title) actions.rename(goal.id, next)
    setDraft(null)
  }

  return (
    <Stack
      direction="row"
      sx={{
        alignItems: 'center',
        gap: 0.25,
        ml: `${indentFor(depth)}px`,
        // One line per row, which reads as a continuous rail down a run
        // of siblings — the thing that keeps depth legible once the
        // indent stops growing.
        ...(depth > 0 && { borderLeft: '1px solid', borderColor: 'divider' }),
        ...ROW_HOVER,
      }}
    >
      {/* Keeps every row's checkbox on the same vertical line whether or
          not it has anything to fold. */}
      <Box sx={{ width: 28, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        {hasChildren && (
          <IconButton
            size="small"
            sx={{ p: 0.25 }}
            aria-label={t(collapsed ? 'goals.expand' : 'goals.collapse')}
            onClick={() => actions.toggleCollapse(goal.id)}
          >
            {collapsed ? (
              <ChevronRightIcon fontSize="small" />
            ) : (
              <ExpandMoreIcon fontSize="small" />
            )}
          </IconButton>
        )}
      </Box>

      <Checkbox
        size="small"
        sx={{ p: 0.5 }}
        checked={finished}
        onChange={() => actions.toggleDone(goal)}
      />

      {draft === null ? (
        <Typography
          variant="body2"
          onClick={() => setDraft(goal.title)}
          sx={{
            flexGrow: 1,
            minWidth: 0,
            cursor: 'text',
            py: 0.25,
            textDecoration: finished ? 'line-through' : 'none',
            color: finished ? 'text.disabled' : 'text.primary',
          }}
        >
          {goal.title}
        </Typography>
      ) : (
        <TextField
          size="small"
          variant="standard"
          autoFocus
          fullWidth
          value={draft}
          sx={{ flexGrow: 1 }}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit()
            if (event.key === 'Escape') setDraft(null)
          }}
        />
      )}

      {total > 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, px: 0.5 }}>
          {t('goals.progress', { done, total })}
        </Typography>
      )}

      {hiddenDue && (
        <Tooltip title={t('goals.insideDeadline', { date: formatDateOnly(hiddenDue, locale) })}>
          <Typography
            variant="caption"
            sx={{ flexShrink: 0, px: 0.5, color: dueColor(hiddenDue, today), fontStyle: 'italic' }}
          >
            ↳ {formatDateOnly(hiddenDue, locale)}
          </Typography>
        </Tooltip>
      )}

      {goal.dueOn ? (
        <Typography
          component="button"
          variant="caption"
          onClick={(event) => actions.openDate(event.currentTarget, node)}
          sx={{
            flexShrink: 0,
            px: 0.5,
            border: 0,
            bgcolor: 'transparent',
            cursor: 'pointer',
            font: 'inherit',
            color: finished ? 'text.disabled' : dueColor(goal.dueOn, today),
          }}
        >
          {formatDateOnly(goal.dueOn, locale)}
        </Typography>
      ) : (
        <Tooltip title={t('goals.setDeadline')}>
          <IconButton
            size="small"
            sx={{ p: 0.25, flexShrink: 0 }}
            aria-label={t('goals.setDeadline')}
            onClick={(event) => actions.openDate(event.currentTarget, node)}
          >
            <EventOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Level ten is the last one the database will accept (migration
          0019), so the button that would create level eleven is not
          offered rather than left to fail. */}
      {depth + 1 < MAX_GOAL_DEPTH && (
        <Tooltip title={t('goals.addStep')}>
          <IconButton
            size="small"
            sx={{ p: 0.25, flexShrink: 0 }}
            aria-label={t('goals.addStep')}
            onClick={() => actions.addStep(goal.id)}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title={t('goals.delete')}>
        <IconButton
          size="small"
          sx={{ p: 0.25, flexShrink: 0 }}
          aria-label={t('goals.delete')}
          onClick={() => actions.remove(node)}
        >
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  )
}
