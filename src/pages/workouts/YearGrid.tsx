import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { useTranslation } from "react-i18next";
import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";
import { addDays, formatMonth, formatWeekdayDay } from "../../lib/formatDate";
import type { Exercise, WorkoutSet } from "../../lib/workouts/db";
import { buildYearGrid } from "../../lib/workouts/grid";
import {
  planPaste,
  toTsv,
  type Block,
  type PastePlan,
} from "../../lib/workouts/clipboard";
import { noSpinners } from "./numberField";

export type { PastePlan };

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
  paste(plan: PastePlan): void;
  openDayMenu(anchor: HTMLElement, day: string, exerciseId: string): void;
}

type Editing = { day: string; exerciseId: string; slot: number } | null;

/** Where a cell sits among the set columns. Both zero-based. */
interface Pos {
  row: number;
  col: number;
}



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

/**
 * The line where one exercise's block of columns starts.
 *
 * Every cell carried the same hairline, so four columns of pull ups and
 * four of push ups read as one run of eight and the eye had to go up to
 * the header to find the join. This draws the join itself, on the first
 * column of each exercise and on every row — header, month totals and
 * days alike, or the line would stop at the top of the year.
 */
const groupEdge = {
  borderLeftWidth: 2,
  borderLeftColor: "text.disabled",
} as const;

export default function YearGrid({
  year,
  exercises,
  sets,
  today,
  actions,
  hideEmpty = true,
  weekOnly = true,
  hidePastMonths = false,
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
  /**
   * Months already finished are left out of the current year
   * entirely, header and all.
   *
   * Only the current year: in a past year every month is a past
   * month, and applying this there would make opening the year show
   * nothing at all.
   */
  hidePastMonths?: boolean;
  /** Draw at most this many set columns per exercise. */
  columnCap?: number;
  isMonthOpen(year: number, month: number): boolean;
  onToggleMonth(year: number, month: number): void;
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const [editing, setEditing] = useState<Editing>(null);

  /**
   * A rectangle of cells, for copying out and pasting in.
   *
   * Held as the two corners the mouse drew rather than as a list of
   * cells: dragging only moves the second one, and the rectangle
   * between them is what is drawn and what is copied.
   */
  const [selection, setSelection] = useState<{
    anchor: Pos;
    focus: Pos;
  } | null>(null);
  const dragging = useRef(false);

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
      const thisYear = year === Number(today.slice(0, 4));
      const thisMonth = thisYear && month.month === currentMonth;

      let days = month.days;
      // Dropped outright rather than folded: see the prop's comment for
      // why a past year is left alone.
      if (hidePastMonths && thisYear && month.month < currentMonth) days = [];
      if (weekOnly && thisMonth) {
        days = days.filter((row) => row.date >= weekFrom && row.date <= weekTo);
      }
      if (hideEmpty) {
        days = days.filter((row) => row.total > 0 || row.date === today);
      }
      return { ...month, days, open: isMonthOpen(year, month.month) };
    })
    .filter((month) => month.days.length > 0);

  /**
   * The set columns left to right, and the day rows top to bottom, as
   * they are on screen.
   *
   * Selection, copy and paste all work in these coordinates. The
   * day-total columns are left out: they are arithmetic, not cells
   * anyone can type into, and a copied block with totals wedged into
   * every fifth column would paste back as nonsense. Folded months are
   * left out for the same reason the Enter key skips them — what is
   * not on screen cannot be dragged across.
   */
  const columns = exercises.flatMap((exercise) =>
    Array.from({ length: grid.width[exercise.id] ?? 0 }, (_ignored, slot) => ({
      exerciseId: exercise.id,
      slot,
    })),
  );
  const columnOf = new Map(
    columns.map((column, index) => [`${column.exerciseId}:${column.slot}`, index]),
  );
  const rows = visible.filter((month) => month.open).flatMap((month) => month.days);
  const rowOf = new Map(rows.map((row, index) => [row.date, index]));

  const block: Block | null = selection && {
    top: Math.min(selection.anchor.row, selection.focus.row),
    bottom: Math.max(selection.anchor.row, selection.focus.row),
    left: Math.min(selection.anchor.col, selection.focus.col),
    right: Math.max(selection.anchor.col, selection.focus.col),
  };
  const selected = (row: number, col: number) =>
    block !== null &&
    row >= block.top &&
    row <= block.bottom &&
    col >= block.left &&
    col <= block.right;

  /*
   * The clipboard handlers are hung on the document once and read the
   * current grid through this, rather than being torn down and hung up
   * again on every render — which is what a dependency list of freshly
   * built arrays would do.
   */
  const latest = useRef({ block, rows, columns, editing, actions });
  latest.current = { block, rows, columns, editing, actions };

  /* The table itself, to tell a press on a cell from a press away. */
  const area = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stop = () => {
      dragging.current = false;
    };

    const onCopy = (event: ClipboardEvent) => {
      const { block: area, rows: days, columns: cols, editing: open } = latest.current;
      if (!area || open) return;

      event.clipboardData?.setData("text/plain", toTsv(area, days, cols));
      event.preventDefault();
    };

    const onPaste = (event: ClipboardEvent) => {
      const {
        block: area,
        rows: days,
        columns: cols,
        editing: open,
        actions: act,
      } = latest.current;
      if (!area || open) return;

      const text = event.clipboardData?.getData("text/plain") ?? "";
      if (text === "") return;
      event.preventDefault();

      const plan = planPaste(text, area, days, cols);
      if (plan.write.length > 0 || plan.clear.length > 0) act.paste(plan);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !latest.current.editing) setSelection(null);
    };

    /*
     * A press anywhere else drops the selection, the way a spreadsheet
     * does — otherwise a block stays lit long after the eye has moved
     * on, and the next copy takes cells nobody meant. The grid's own
     * dialog is drawn in a portal outside the table, so pressing its
     * buttons is not clicking away.
     */
    const onMouseDown = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (area.current?.contains(target)) return;
      if (target instanceof Element && target.closest('[role="dialog"]')) return;
      setSelection(null);
    };

    window.addEventListener("mouseup", stop);
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mouseup", stop);
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

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
    <Box ref={area} sx={{ overflowX: "auto", mb: 3 }}>
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
                sx={{ ...cell, ...groupEdge, fontWeight: 700 }}
              >
                {exercise.name}{" "}
                {/* The year's total for THIS exercise, beside the name
                    it belongs to. It used to sit above the day-total
                    column, a row down, where it read as the heading of
                    that column rather than as the exercise's figure. */}
                <Box
                  component="span"
                  sx={{ fontWeight: 400, color: "text.secondary" }}
                >
                  {grid.totals[exercise.id] ?? 0}
                  {/* The biggest single set beside the year's total:
                      how much at once, next to how much in all. Left
                      out when there is nothing to report, so a fresh
                      exercise does not carry a "max 0". */}
                  {(grid.best[exercise.id] ?? 0) > 0 && (
                    <Box
                      component="span"
                      title={t("workouts.bestSetHint")}
                      sx={{ ml: 0.75, opacity: 0.75 }}
                    >
                      {t("workouts.bestSet", {
                        value: grid.best[exercise.id],
                      })}
                    </Box>
                  )}
                </Box>
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
                    sx={{
                      ...cell,
                      ...(slot === 0 && groupEdge),
                      color: "text.secondary",
                      fontWeight: 400,
                    }}
                  >
                    {slot + 1}
                  </Box>
                ),
              ).concat(
                // Blank: the number moved up to the name. The cell
                // stays so the day-total column still has a heading
                // slot and the columns keep lining up.
                <Box
                  component="th"
                  key={`${exercise.id}-total`}
                  sx={totalCell}
                />,
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
                  sx={{ ...totalCell, ...groupEdge }}
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

                        const here: Pos = {
                          row: rowOf.get(row.date) ?? -1,
                          col: columnOf.get(`${exercise.id}:${slot}`) ?? -1,
                        };
                        const isSelected = selected(here.row, here.col);

                        return (
                          <Box
                            component="td"
                            key={slot}
                            onMouseDown={(event: MouseEvent<HTMLElement>) => {
                              // Without this the browser paints its own
                              // text selection across the cells as the
                              // drag moves.
                              event.preventDefault();
                              dragging.current = true;
                              setSelection((previous) =>
                                event.shiftKey && previous
                                  ? { ...previous, focus: here }
                                  : { anchor: here, focus: here },
                              );
                            }}
                            onMouseEnter={() => {
                              if (!dragging.current) return;
                              setSelection((previous) =>
                                previous ? { ...previous, focus: here } : previous,
                              );
                            }}
                            onClick={(event: MouseEvent<HTMLElement>) => {
                              // Shift is for growing the selection, not
                              // for opening the cell it lands on.
                              if (event.shiftKey) return;
                              setEditing({
                                day: row.date,
                                exerciseId: exercise.id,
                                slot,
                              });
                            }}
                            sx={{
                              ...cell,
                              ...(slot === 0 && groupEdge),
                              minWidth: 34,
                              cursor: "cell",
                              /* A cell with a set in it is tinted, so
                                 the days that were trained stand out
                                 from the empty grid around them at a
                                 glance rather than by reading every
                                 number. Faint on purpose: the figures
                                 are the content, and a strong fill
                                 across most of the page would compete
                                 with them. */
                              ...(set && {
                                bgcolor: (theme) =>
                                  alpha(theme.palette.primary.main, 0.1),
                              }),
                              "&:hover": { bgcolor: "action.hover" },
                              /* After the hover rule on purpose: a
                                 selected cell stays selected-looking
                                 under the pointer, or the cell being
                                 dragged over would be the one cell that
                                 does not show it is in the block. */
                              ...(isSelected && {
                                bgcolor: (theme) =>
                                  alpha(theme.palette.primary.main, 0.32),
                                "&:hover": {
                                  bgcolor: (theme) =>
                                    alpha(theme.palette.primary.main, 0.32),
                                },
                              }),
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
                                  ...noSpinners,
                                  width: 34,
                                  border: 0,
                                  p: 0,
                                  textAlign: "center",
                                  font: "inherit",
                                  color: "inherit",
                                  bgcolor: "transparent",
                                  "&:focus": { outline: "none" },
                                  /*
                                   * iOS Safari zooms the whole page in
                                   * when a field smaller than 16px takes
                                   * focus — and does not zoom back out
                                   * when it loses focus, so one tap on a
                                   * cell leaves the grid magnified and
                                   * scrolled sideways.
                                   *
                                   * The field is 16px on touch devices
                                   * instead. The usual fix, a
                                   * maximum-scale on the viewport tag,
                                   * would stop the browser zooming at
                                   * all — including the pinch needed to
                                   * read a grid this dense.
                                   *
                                   * Width stays 34px: three digits fit,
                                   * and a wider field would shove the
                                   * columns sideways on every tap.
                                   */
                                  "@media (pointer: coarse)": {
                                    fontSize: "16px",
                                  },
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
