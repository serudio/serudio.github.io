import { useTranslation } from 'react-i18next'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import { QUOTE_CATEGORIES } from '../../data/quoteCategories'

/**
 * Multiselect category filter. Restricted categories (demotivational)
 * are offered like any other — the point is that they are opt-in, not
 * hidden from the visitor's choice.
 */
export default function CategoryFilter({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const { t } = useTranslation()

  const toggle = (slug: string) =>
    onChange(
      selected.includes(slug) ? selected.filter((item) => item !== slug) : [...selected, slug],
    )

  return (
    <Stack
      direction="row"
      useFlexGap
      flexWrap="wrap"
      spacing={1}
      sx={{ rowGap: 1 }}
      role="group"
      aria-label={t('quotes.filterLabel')}
    >
      {QUOTE_CATEGORIES.map((category) => {
        const active = selected.includes(category.slug)
        return (
          <Chip
            key={category.slug}
            label={t(category.nameKey)}
            size="small"
            clickable
            aria-pressed={active}
            color={active ? (category.restricted ? 'warning' : 'primary') : 'default'}
            variant={active ? 'filled' : 'outlined'}
            onClick={() => toggle(category.slug)}
          />
        )
      })}
    </Stack>
  )
}
