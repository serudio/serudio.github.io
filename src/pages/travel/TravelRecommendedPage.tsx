import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import InputAdornment from '@mui/material/InputAdornment'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SearchIcon from '@mui/icons-material/Search'
import Seo from '../../components/Seo'
import Footer from '../../components/Footer'
import { useAuth } from '../../auth/useAuth'
import {
  RECOMMENDED_GROUPS,
  recommendedSets,
  type RecommendedSet,
} from '../../data/travel/recommended'
import {
  addRecommendedSet,
  createTripFromTemplate,
  ensureTemplateTrip,
  getTrips,
} from '../../lib/travel/db'
import { useDeclarePageChrome } from '../../components/pageChrome'

/**
 * The recommended catalogue: browsable by anyone, signed in or not.
 *
 * Adding a section to your own list needs an account, so those buttons
 * only appear once signed in — the page itself stays public so it can be
 * read and linked without one.
 */
export default function TravelRecommendedPage() {
  const { t, i18n } = useTranslation()

  useDeclarePageChrome({ backTo: '/travel', backLabel: t('travel.backToTravel'), width: 'md' })
  const { session } = useAuth()
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return recommendedSets
    // Match the section name or any item inside it, so searching
    // "зарядка" finds the section that holds it.
    return recommendedSets.filter(
      (set) =>
        set.name.toLowerCase().includes(needle) ||
        set.items.some((item) => item.toLowerCase().includes(needle)),
    )
  }, [query])

  /**
   * The trip a section should land in: the most recent one, or a new
   * one when there is none.
   *
   * This used to be a prop the router never passed, so "add to current
   * trip" could only ever answer that there wasn't one. Starting a trip
   * is what you would do next anyway, so it does that instead of
   * sending you away to do it by hand and come back.
   */
  const currentTrip = async (): Promise<{ id: string; created: boolean }> => {
    const trips = await getTrips()
    const current = trips.find((trip) => !trip.isTemplate && !trip.archived)
    if (current) return { id: current.id, created: false }

    // Seeded from the default list, the same as a trip started from the
    // travel page — a new trip is not meant to be emptier than that.
    const id = await createTripFromTemplate({
      name: new Date().toLocaleDateString(i18n.language),
    })
    return { id, created: true }
  }

  const addTo = async (set: RecommendedSet, target: 'trip' | 'template') => {
    setBusy(`${set.key}:${target}`)
    try {
      const destination =
        target === 'template'
          ? { id: await ensureTemplateTrip(), created: false }
          : await currentTrip()

      await addRecommendedSet(destination.id, set)
      setMessage(
        t(
          target === 'template'
            ? 'travel.addedToDefault'
            : destination.created
              ? 'travel.addedToNewTrip'
              : 'travel.addedToTrip',
          { section: set.name },
        ),
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Container maxWidth="md" disableGutters>
      <Seo
        title={t('travel.recommendedTitle')}
        description={t('travel.recommendedSeoDescription')}
        path="/travel/recommended"
      />
      <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Typography variant="h5" component="h1" sx={{ mb: 1 }}>
          {t('travel.recommendedTitle')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('travel.recommendedIntro')}
        </Typography>

        <TextField
          fullWidth
          size="small"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('travel.searchRecommended')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        {!session && (
          <Alert severity="info" sx={{ mb: 3 }}>
            {t('travel.signInToAdd')}
          </Alert>
        )}

        {RECOMMENDED_GROUPS.map((group) => {
          const sets = matches.filter((set) => set.group === group)
          if (sets.length === 0) return null

          return (
            <Box key={group} sx={{ mb: 3 }}>
              <Typography
                variant="caption"
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'text.secondary',
                  fontWeight: 700,
                  display: 'block',
                  mb: 1,
                }}
              >
                {t(`travel.groups.${group}`)}
              </Typography>

              {sets.map((set) => (
                <Accordion key={set.key} disableGutters sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Stack
                      direction="row"
                      sx={{ alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}
                    >
                      {/* The colour is the section's identity — the same
                          swatch follows it into your own list. */}
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          bgcolor: set.color,
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="subtitle2">{set.name}</Typography>
                      <Chip size="small" variant="outlined" label={set.items.length} />
                      {set.hint && (
                        <Typography variant="caption" color="text.secondary">
                          {set.hint}
                        </Typography>
                      )}
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense disablePadding>
                      {set.items.map((item) => (
                        <ListItem key={item} disablePadding sx={{ py: 0.25 }}>
                          <ListItemText primary={item} />
                        </ListItem>
                      ))}
                    </List>

                    {session && (
                      <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={busy !== null}
                          onClick={() => void addTo(set, 'trip')}
                        >
                          {t('travel.addToTrip')}
                        </Button>
                        <Button
                          size="small"
                          disabled={busy !== null}
                          onClick={() => void addTo(set, 'template')}
                        >
                          {t('travel.addToDefault')}
                        </Button>
                      </Stack>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )
        })}

        {matches.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            {t('travel.noRecommendedMatches')}
          </Typography>
        )}

        <Footer />
      </Paper>

      <Snackbar
        open={message !== null}
        autoHideDuration={4000}
        onClose={() => setMessage(null)}
        message={message ?? ''}
      />
    </Container>
  )
}
