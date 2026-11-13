import { Fragment, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import { addDays, formatMonth, formatWeekdayDay } from "../../lib/formatDate";
import type { Exercise, WorkoutSet } from "../../lib/workouts/db";
import { buildYearGrid } from "../../lib/workouts/grid";

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
  write(day: string, exerciseId: string, slot: number, reps: number): void;
  clear(set: WorkoutSet): void;
  openDayMenu(anchor: HTMLElement, day: string, exerciseId: string): void;
}

type Editing = { day: string; exerciseId: string; slot: number } | null;

const cell = {
  border: "1px solid",
  borderColor: "divider",
  px: 0.5,
  py: 0.25,
  textAlign: "center",
  fontSize: "0.75rem",
  whiteSpace: "nowrap",
} as const;

const totalCell = {
  ...cell,
  fontWeight: 700,
  bgcolor: "action.hover",
} as const;

export default function YearGrid({
  year,
  exercises,
  sets,
  today,
  actions,
  hideEmpty = true,
  weekOnly = true,
  columnCap,
  isMonthOpen,
  onToggleMonth,
}: {
  year: number;
  exercises: Exercise[];
  sets: WorkoutSet[];
  today: string;
  actions: GridActions;
  hideEmpty?: boolean;
  weekOnly?: boolean;
  /** Draw at most this many set columns per exercise. */
  columnCap?: number;
  isMonthOpen(year: number, month: number): boolean;
  onToggleMonth(year: number, month: number): void;
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const [editing, setEditing] = useState<Editing>(null);

  const grid = buildYearGrid(sets, exercises, year, today, columnCap);

  // Today always stays, even with nothing on it: it is the row the next
  // set gets typed into, and hiding it would mean turning the filter
  // off again to log a workout.
  // Monday to Sunday around today. getDay() calls Sunday 0, so it is
  // rotated: a week that starts on Monday is the one being trained in.
  const weekday = (new Date(`${today}T00:00:00`).getDay() + 6) % 7;
  const weekFrom = addDays(today, -weekday);
  const weekTo = addDays(weekFrom, 6);
  const currentMonth = Number(today.slice(5, 7));

  const visible = grid.months
    .map((month) => {
      // The week filter is about the month in progress. Earlier months
      // are already a fold away, and a past year would otherwise empty
      // itself entirely.
      const thisMonth =
        year === Number(today.slice(0, 4)) && month.month === currentMonth;

      let days = month.days;
      if (weekOnly && thisMonth) {
        days = days.filter((row) => row.date >= weekFrom && row.date <= weekTo);
      }
      if (hideEmpty) {
        days = days.filter((row) => row.total > 0 || row.date === today);
      }
      return { ...month, days, open: isMonthOpen(year, month.month) };
    })
    .filter((month) => month.days.length > 0);

  const commit = (
    day: string,
    exerciseId: string,
    slot: number,
    raw: string,
    existing?: WorkoutSet,
  ) => {
    setEditing(null);
    const reps = Number.parseInt(raw, 10);

    // Anything that is not a positive number clears the cell: a set of
    // zero is not a set that happened.
    if (!Number.isFinite(reps) || reps <= 0) {
      if (existing) actions.clear(existing);
      return;
    }
    if (existing?.reps === reps) return;
    actions.write(day, exerciseId, slot, reps);
  };

  const move = (
    day: string,
    exerciseId: string,
    slot: number,
    direction: "down" | "right",
  ) => {
    if (direction === "right") {
      const width = grid.width[exerciseId] ?? 0;
      if (slot + 1 < width) setEditing({ day, exerciseId, slot: slot + 1 });
      return;
    }
    // Only what is on screen: Enter must not drop the cursor into a
    // month that is folded shut.
    const days = visible
      .filter((month) => month.open)
      .flatMap((month) => month.days.map((row) => row.date));
    const next = days[days.indexOf(day) + 1];
    if (next) setEditing({ day: next, exerciseId, slot });
  };

  if (exercises.length === 0) return null;

  return (
    <Box sx={{ overflowX: "auto", mb: 3 }}>
      <Box
        component="table"
        sx={{ borderCollapse: "collapse", width: "max-content" }}
      >
        <Box component="thead">
          <Box component="tr">
            <Box
              component="th"
              sx={{ ...totalCell, position: "sticky", left: 0, zIndex: 2 }}
            >
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
          </Box>

          <Box component="tr">
            {/* Deliberately blank. A single number for everything done
                in a year is not a figure anyone acts on, and it sat at
                the top of every column of real ones. */}
            <Box
              component="th"
              sx={{ ...totalCell, position: "sticky", left: 0, zIndex: 2 }}
            />
            {exercises.map((exercise) =>
              Array.from(
                { length: grid.width[exercise.id] ?? 0 },
                (_ignored, slot) => (
                  <Box
                    component="th"
                    key={`${exercise.id}-${slot}`}
                    sx={{ ...cell, color: "text.secondary", fontWeight: 400 }}
                  >
                    {slot + 1}
                  </Box>
                ),
              ).concat(
                <Box component="th" key={`${exercise.id}-total`} sx={totalCell}>
                  {grid.totals[exercise.id] ?? 0}
                </Box>,
              ),
            )}
          </Box>
        </Box>

        {visible.map((month) => (
          <Box component="tbody" key={month.month}>
            <Box component="tr">
              <Box
                component="td"
                sx={{
                  ...totalCell,
                  position: "sticky",
                  left: 0,
                  zIndex: 1,
                  textAlign: "left",
                  textTransform: "capitalize",
                  cursor: "pointer",
                  userSelect: "none",
                }}
                onClick={() => onToggleMonth(year, month.month)}
                title={t(month.open ? "workouts.collapse" : "workouts.expand")}
              >
                {month.open ? "▾" : "▸"}{" "}
                {formatMonth(year, month.month, locale)}
              </Box>
              {exercises.map((exercise) => (
                <Box
                  component="td"
                  key={exercise.id}
                  colSpan={(grid.width[exercise.id] ?? 0) + 1}
                  sx={totalCell}
                >
                  {month.totals[exercise.id] ?? 0}
                </Box>
              ))}
            </Box>

            {month.open &&
              month.days.map((row) => (
                <Box
                  component="tr"
                  key={row.date}
                  sx={{
                    ...(row.date === today && {
                      outline: "2px solid",
                      outlineColor: "primary.main",
                    }),
                  }}
                >
                  <Box
                    component="td"
                    sx={{
                      ...cell,
                      position: "sticky",
                      left: 0,
                      zIndex: 1,
                      bgcolor: "background.paper",
                      textAlign: "left",
                      color: row.total === 0 ? "text.disabled" : "text.primary",
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
                          editing.slot === slot;

                        return (
                          <Box
                            component="td"
                            key={slot}
                            onClick={() =>
                              setEditing({
                                day: row.date,
                                exerciseId: exercise.id,
                                slot,
                              })
                            }
                            sx={{
                              ...cell,
                              minWidth: 34,
                              cursor: "cell",
                              "&:hover": { bgcolor: "action.hover" },
                            }}
                          >
                            {isEditing ? (
                              <Box
                                component="input"
                                type="number"
                                autoFocus
                                defaultValue={set?.reps ?? ""}
                                onBlur={(event) =>
                                  commit(
                                    row.date,
                                    exercise.id,
                                    slot,
                                    event.target.value,
                                    set,
                                  )
                                }
                                onKeyDown={(event) => {
                                  const value = (
                                    event.target as HTMLInputElement
                                  ).value;
                                  if (event.key === "Escape") setEditing(null);
                                  if (event.key === "Enter") {
                                    commit(
                                      row.date,
                                      exercise.id,
                                      slot,
                                      value,
                                      set,
                                    );
                                    move(row.date, exercise.id, slot, "down");
                                  }
                                  if (event.key === "Tab") {
                                    event.preventDefault();
                                    commit(
                                      row.date,
                                      exercise.id,
                                      slot,
                                      value,
                                      set,
                                    );
                                    move(row.date, exercise.id, slot, "right");
                                  }
                                }}
                                sx={{
                                  width: 34,
                                  border: 0,
                                  p: 0,
                                  textAlign: "center",
                                  font: "inherit",
                                  color: "inherit",
                                  bgcolor: "transparent",
                                  "&:focus": { outline: "none" },
                                }}
                              />
                            ) : (
                              (set?.reps ?? "")
                            )}
                          </Box>
                        );
                      })}

                      {/* The day's total for this exercise, and the way
                          in to copying it somewhere else — a menu
                          button of its own in every group would cost a
                          column each. */}
                      <Box
                        component="td"
                        onClick={(event: MouseEvent<HTMLElement>) => {
                          if ((row.totals[exercise.id] ?? 0) > 0) {
                            actions.openDayMenu(
                              event.currentTarget,
                              row.date,
                              exercise.id,
                            );
                          }
                        }}
                        title={
                          (row.hidden[exercise.id] ?? 0) > 0
                            ? t("workouts.setsNotShown", {
                                count: row.hidden[exercise.id],
                              })
                            : undefined
                        }
                        sx={{
                          ...totalCell,
                          cursor:
                            (row.totals[exercise.id] ?? 0) > 0
                              ? "pointer"
                              : "default",
                          color:
                            (row.totals[exercise.id] ?? 0) > 0
                              ? "text.primary"
                              : "text.disabled",
                        }}
                      >
                        {row.totals[exercise.id] ?? 0}
                        {/* The total counts sets with no column to sit
                            in, so it says so rather than looking like
                            arithmetic that does not work. */}
                        {(row.hidden[exercise.id] ?? 0) > 0 && (
                          <Box component="span" sx={{ color: "warning.main" }}>
                            {"\u00b7\u00b7"}
                          </Box>
                        )}
                      </Box>
                    </Fragment>
                  ))}
                </Box>
              ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
