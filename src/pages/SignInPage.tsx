import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import Seo from '../components/Seo'
import { peekReturnTo } from '../auth/returnTo'
import { useAuth } from '../auth/useAuth'

/**
 * One sign-in page for every project in this repo. Guards send visitors
 * here with the page they wanted in location.state, and Google sends them
 * back to the site root — where the saved path takes over.
 */
export default function SignInPage() {
  const { session, loading, configured, signIn, signOut, email } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  const requestedPath = (location.state as { returnTo?: string } | null)?.returnTo ?? null

  useEffect(() => {
    if (!session) return
    // useAuthReturn handles the stored path; only step in when there
    // isn't one, so the two never redirect to different places.
    if (peekReturnTo()) return
    navigate(requestedPath ?? '/', { replace: true })
  }, [session, requestedPath, navigate])

  return (
    <Container maxWidth="sm">
      <Seo title={t('auth.signInTitle')} path="/signin" noIndex />

      <Paper variant="outlined" sx={{ p: 4 }}>
        {!configured ? (
          <Alert severity="error">{t('auth.notConfigured')}</Alert>
        ) : loading || session ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
            <Typography variant="h6" component="h1">
              {t('auth.signInTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('auth.signInBody')}
            </Typography>
            <Button
              variant="contained"
              onClick={() => void signIn(requestedPath ?? '/')}
            >
              {t('auth.continueWithGoogle')}
            </Button>
            {email && (
              <Button size="small" onClick={() => void signOut()}>
                {t('auth.signOut')}
              </Button>
            )}
          </Stack>
        )}
      </Paper>
    </Container>
  )
}
