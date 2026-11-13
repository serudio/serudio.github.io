import { Fragment, useEffect, useRef, useState, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import { formatMonth, formatWeekdayDay } from '../../lib/formatDate'
import type { Exercise, WorkoutSet } from '../../lib/workouts/db'
import { buildYearGrid } from '../../lib/workouts/grid'

/**
 * One year, days down and exercises across — the layout these records
 * were already kept in.
 *
 * Cells are plain text until one is clicked, and only the clicked cell
 * becomes an input. A year of nine exercises is something like fifty
 * columns, and rendering an input in every one of them would mean a
 * thousand live fields on the page for no gain.
 */

export interface GridActions {
  write(day: string, exerciseId: string, slot: number, reps: number): void
  clear(set: WorkoutSet): void
  openDayMenu(anchor: HTMLElement, day: string, exerciseId: string): void
}

type Editing = { day: string; exerciseId: string; slot: number } | null

const cell = {
  border: '1px solid',
  borderColor: 'divider',
  px: 0.5,
  py: 0.25,
  textAlign: 'center',
  fontSize: '0.75rem',
  whiteSpace: 'nowrap',
} as const

const totalCell = {
  ...cell,
  fontWeight: 700,
  bgcolor: 'action.hover',
} as const

export default function YearGrid({
  year,
  exercises,
  sets,
  today,
  actions,
  scrollToToday = false,
}: {
  year: number
  exercises: Exercise[]
  sets: WorkoutSet[]
  today: string
  actions: GridActions
  scrollToToday?: boolean
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? i18n.language
  const [editing, setEditing] = useState<Editing>(null)
  const todayRow = useRef<HTMLTableRowElement | null>(null)

  const grid = buildYearGrid(sets, exercises, year, today)

  useEffect(() => {
    // The year reads in its own order, January first, so today has to
    // be brought to the reader rather than the year turned around.
    if (scrollToToday) todayRow.current?.scrollIntoView({ block: 'center' })
  }, [scrollToToday])

  const commit = (day: string, exerciseId: string, slot: number, raw: string, existing?: WorkoutSet) => {
    setEditing(null)
    const reps = Number.parseInt(raw, 10)

    // Anything that is not a positive number clears the cell: a set of
    // zero is not a set that happened.
    if (!Number.isFinite(reps) || reps <= 0) {
      if (existing) actions.clear(existing)
      return
    }
    if (existing?.reps === reps) return
    actions.write(day, exerciseId, slot, reps)
  }

  const move = (day: string, exerciseId: string, slot: number, direction: 'down' | 'right') => {
    if (direction === 'right') {
      const width = grid.width[exerciseId] ?? 0
      if (slot + 1 < width) setEditing({ day, exerciseId, slot: slot + 1 })
      return
    }
    const days = grid.months.flatMap((month) => month.days.map((row) => row.date))
    const next = days[days.indexOf(day) + 1]
    if (next) setEditing({ day: next, exerciseId, slot })
  }

  if (exercises.length === 0) return null

  return (
    <Box sx={{ overflowX: 'auto', mb: 3 }}>
      <Box component="table" sx={{ borderCollapse: 'collapse', width: 'max-content' }}>
        <Box component="thead">
          <Box component="tr">
            <Box component="th" sx={{ ...totalCell, position: 'sticky', left: 0, zIndex: 2 }}>
              {year}
            </Box>
            {exercises.map((exercise) => (
              <Box
                component="th"
                key={exercise.id}
                colSpan={(grid.width[exercise.id] ?? 0) + 1}
                sx={{ ...cell, fontWeight: 700 }}
              >
                {exercise.name}
              </Box>
            ))}
            <Box component="th" sx={totalCell}>
              {t('workouts.total')}
            </Box>
          </Box>

          <Box component="tr">
            <Box
              component="th"
              sx={{ ...totalCell, position: 'sticky', left: 0, zIndex: 2 }}
            >
              {grid.total}
            </Box>
            {exercises.map((exercise) =>
              Array.from({ length: grid.width[exercise.id] ?? 0 }, (_ignored, slot) => (
                <Box
                  component="th"
                  key={`${exercise.id}-${slot}`}
                  sx={{ ...cell, color: 'text.secondary', fontWeight: 400 }}
                >
                  {slot + 1}
                </Box>
              )).concat(
                <Box component="th" key={`${exercise.id}-total`} sx={totalCell}>
                  {grid.totals[exercise.id] ?? 0}
                </Box>,
              ),
            )}
            <Box component="th" sx={totalCell} />
          </Box>
        </Box>

        {grid.months.map((month) => (
          <Box component="tbody" key={month.month}>
              <Box component="tr">
                <Box
                  component="td"
                  sx={{
                    ...totalCell,
                    position: 'sticky',
                    left: 0,
                    zIndex: 1,
                    textAlign: 'left',
                    textTransform: 'capitalize',
                  }}
                >
                  {formatMonth(year, month.month, locale)}
                </Box>
                {exercises.map((exercise) => (
                  <Box component="td" key={exercise.id} colSpan={(grid.width[exercise.id] ?? 0) + 1} sx={totalCell}>
                    {month.totals[exercise.id] ?? 0}
                  </Box>
                ))}
                <Box component="td" sx={totalCell}>
                  {month.total}
                </Box>
              </Box>

              {month.days.map((row) => (
                <Box
                  component="tr"
                  key={row.date}
                  ref={row.date === today ? todayRow : undefined}
                  sx={{
                    ...(row.date === today && { outline: '2px solid', outlineColor: 'primary.main' }),
                  }}
                >
                  <Box
                    component="td"
                    sx={{
                      ...cell,
                      position: 'sticky',
                      left: 0,
                      zIndex: 1,
                      bgcolor: 'background.paper',
                      textAlign: 'left',
                      color: row.total === 0 ? 'text.disabled' : 'text.primary',
                    }}
                  >
                    {formatWeekdayDay(row.date, locale)}
                  </Box>

                  {exercises.map((exercise) => (
                    <Fragment key={exercise.id}>
                      {row.slots[exercise.id].map((set, slot) => {
                        const isEditing =
                          editing?.day === row.date &&
                          editing.exerciseId === exercise.id &&
                          editing.slot === slot

                        return (
                          <Box
                            component="td"
                            key={slot}
                            onClick={() =>
                              setEditing({ day: row.date, exerciseId: exercise.id, slot })
                            }
                            sx={{
                              ...cell,
                              minWidth: 34,
                              cursor: 'cell',
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            {isEditing ? (
                              <Box
                                component="input"
                                type="number"
                                autoFocus
                                defaultValue={set?.reps ?? ''}
                                onBlur={(event) =>
                                  commit(row.date, exercise.id, slot, event.target.value, set)
                                }
                                onKeyDown={(event) => {
                                  const value = (event.target as HTMLInputElement).value
                                  if (event.key === 'Escape') setEditing(null)
                                  if (event.key === 'Enter') {
                                    commit(row.date, exercise.id, slot, value, set)
                                    move(row.date, exercise.id, slot, 'down')
                                  }
                                  if (event.key === 'Tab') {
                                    event.preventDefault()
                                    commit(row.date, exercise.id, slot, value, set)
                                    move(row.date, exercise.id, slot, 'right')
                                  }
                                }}
                                sx={{
                                  width: 34,
                                  border: 0,
                                  p: 0,
                                  textAlign: 'center',
                                  font: 'inherit',
                                  color: 'inherit',
                                  bgcolor: 'transparent',
                                  '&:focus': { outline: 'none' },
                                }}
                              />
                            ) : (
                              (set?.reps ?? '')
                            )}
                          </Box>
                        )
                      })}

                      {/* The day's total for this exercise, and the way
                          in to copying it somewhere else — a menu
                          button of its own in every group would cost a
                          column each. */}
                      <Box
                        component="td"
                        onClick={(event: MouseEvent<HTMLElement>) => {
                          if ((row.totals[exercise.id] ?? 0) > 0) {
                            actions.openDayMenu(event.currentTarget, row.date, exercise.id)
                          }
                        }}
                        sx={{
                          ...totalCell,
                          cursor: (row.totals[exercise.id] ?? 0) > 0 ? 'pointer' : 'default',
                          color: (row.totals[exercise.id] ?? 0) > 0 ? 'text.primary' : 'text.disabled',
                        }}
                      >
                        {row.totals[exercise.id] ?? 0}
                      </Box>
                    </Fragment>
                  ))}

                  <Box component="td" sx={totalCell}>
                    {row.total}
                  </Box>
                </Box>
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  )
}
