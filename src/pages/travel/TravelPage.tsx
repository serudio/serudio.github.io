import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import Seo from '../../components/Seo'
import Footer from '../../components/Footer'
import {
  createTripFromTemplate,
  deleteTrip,
  ensureTemplateTrip,
  getTrips,
  type TravelTrip,
} from '../../lib/travel/db'

function formatRange(trip: TravelTrip): string {
  if (!trip.startsOn && !trip.endsOn) return ''
  return [trip.startsOn, trip.endsOn].filter(Boolean).join(' — ')
}

/**
 * The account's trips: the one being packed for, the default list it is
 * built from, and everything already travelled.
 *
 * Behind <RequireAuth> — a packing list is private data, and the
 * database enforces the same thing independently (migration 0011).
 */
export default function TravelPage() {
  const { t } = useTranslation()
  const [trips, setTrips] = useState<TravelTrip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [startsOn, setStartsOn] = useState('')
  const [endsOn, setEndsOn] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<TravelTrip | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      // Creates the default list on first visit, so the account always
      // has something to start a trip from.
      await ensureTemplateTrip()
      setTrips(await getTrips())
      setError(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleCreate = async () => {
    setSaving(true)
    try {
      await createTripFromTemplate({ name, startsOn, endsOn })
      setCreating(false)
      setName('')
      setStartsOn('')
      setEndsOn('')
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await deleteTrip(confirmDelete.id)
      setConfirmDelete(null)
      await refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    }
  }

  const template = trips.find((trip) => trip.isTemplate)
  const journeys = trips.filter((trip) => !trip.isTemplate)
  const current = journeys.find((trip) => !trip.archived)
  const previous = journeys.filter((trip) => trip !== current)

  const TripCard = ({ trip, subtitle }: { trip: TravelTrip; subtitle?: string }) => (
    <Card variant="outlined" sx={{ mb: 1.5 }}>
      <Stack direction="row" sx={{ alignItems: 'stretch' }}>
        <CardActionArea component={RouterLink} to={`/travel/t/${trip.id}`} sx={{ flexGrow: 1 }}>
          <CardContent sx={{ '&:last-child': { pb: 2 } }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="subtitle1" fontWeight={600}>
                {trip.name}
              </Typography>
              {subtitle && <Chip size="small" variant="outlined" label={subtitle} />}
            </Stack>
            {formatRange(trip) && (
              <Typography variant="body2" color="text.secondary">
                {formatRange(trip)}
              </Typography>
            )}
          </CardContent>
        </CardActionArea>
        {!trip.isTemplate && (
          <Tooltip title={t('travel.delete')}>
            <IconButton
              aria-label={t('travel.delete')}
              onClick={() => setConfirmDelete(trip)}
              sx={{ alignSelf: 'center', mr: 1 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Card>
  )

  return (
    <Container maxWidth="sm" disableGutters>
      <Seo title={t('travel.title')} path="/travel" noIndex />
      <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Stack
          direction="row"
          sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 1 }}
        >
          <Typography variant="h5" component="h1">
            {t('travel.title')}
          </Typography>
          <Button
            size="small"
            startIcon={<LightbulbOutlinedIcon />}
            component={RouterLink}
            to="/travel/recommended"
          >
            {t('travel.recommendedTitle')}
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreating(true)}
              sx={{ my: 2 }}
            >
              {t('travel.newTrip')}
            </Button>

            {current && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  {t('travel.current').toUpperCase()}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <TripCard trip={current} />
                </Box>
              </Box>
            )}

            {template && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  {t('travel.defaultList').toUpperCase()}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <TripCard trip={template} subtitle={t('travel.templateBadge')} />
                </Box>
              </Box>
            )}

            {previous.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  {t('travel.previous').toUpperCase()}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {previous.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))}
                </Box>
              </Box>
            )}

            {journeys.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {t('travel.noTrips')}
              </Typography>
            )}
          </>
        )}

        <Link
          component={RouterLink}
          to="/travel/recommended"
          variant="body2"
          color="text.secondary"
        >
          {t('travel.browseRecommended')}
        </Link>

        <Footer />
      </Paper>

      <Dialog open={creating} onClose={() => setCreating(false)} fullWidth maxWidth="xs">
        <DialogTitle>{t('travel.newTrip')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label={t('travel.tripName')}
              value={name}
              onChange={(event) => setName(event.target.value)}
              fullWidth
              required
              autoFocus
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label={t('travel.startsOn')}
                type="date"
                value={startsOn}
                onChange={(event) => setStartsOn(event.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label={t('travel.endsOn')}
                type="date"
                value={endsOn}
                onChange={(event) => setEndsOn(event.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
            <Typography variant="caption" color="text.secondary">
              {t('travel.createdFromDefault')}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreating(false)}>{t('travel.cancel')}</Button>
          <Button
            variant="contained"
            onClick={() => void handleCreate()}
            disabled={!name.trim() || saving}
          >
            {t('travel.create')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDelete !== null} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>{t('travel.deleteTripTitle')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t('travel.deleteTripBody', { name: confirmDelete?.name ?? '' })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>{t('travel.cancel')}</Button>
          <Button color="error" variant="contained" onClick={() => void handleDelete()}>
            {t('travel.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
