import Box from '@mui/material/Box'
import { alpha, useTheme } from '@mui/material/styles'
import type { TodoItem } from '../../lib/todo/db'
import { colorOf, fontSizeOf } from './colors'

/**
 * One item in the cloud.
 *
 * A real <button>, not a styled <span>: the whole item is the control
 * that opens its editor, and that has to work from the keyboard and be
 * announced as something you can press.
 *
 * Padding is tied to the font size rather than fixed, so a large item
 * gets proportionate space around it instead of looking like big text
 * crammed into a small badge.
 */
export default function TodoPill({
  item,
  selected,
  onOpen,
}: {
  item: TodoItem
  selected: boolean
  onOpen: (anchor: HTMLElement, item: TodoItem) => void
}) {
  const theme = useTheme()
  const color = colorOf(item.color, theme.palette.mode === 'light' ? 'light' : 'dark')
  const done = item.doneAt !== null

  return (
    <Box
      component="button"
      type="button"
      onClick={(event) => onOpen(event.currentTarget, item)}
      sx={{
        appearance: 'none',
        cursor: 'pointer',
        font: 'inherit',
        fontSize: fontSizeOf(item.weight),
        lineHeight: 1.25,
        fontWeight: item.weight >= 6 ? 700 : 500,
        color,
        px: '0.6em',
        py: '0.25em',
        borderRadius: 999,
        /*
         * Crossed off rather than removed, and still its own colour.
         * The wall is a record of what you wanted to do as much as a
         * list of what is left, so a done item stays legible — faded
         * enough to read past, not so far that it is gone.
         */
        textDecoration: done ? 'line-through' : 'none',
        opacity: done ? 0.45 : 1,
        border: `1px solid ${alpha(color, selected ? 0.9 : 0.35)}`,
        backgroundColor: alpha(color, selected ? 0.22 : 0.1),
        transition: 'background-color 120ms, border-color 120ms, font-size 120ms',
        '&:hover': { backgroundColor: alpha(color, 0.2) },
        '&:focus-visible': { outline: `2px solid ${color}`, outlineOffset: 2 },
      }}
    >
      {item.text}
    </Box>
  )
}
