import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SIGN_IN_PATH } from '../config/auth'
import { useAuth } from './useAuth'

interface RequireAuthProps {
  children: ReactNode
  /** Also require the account to be on the admin list, not just signed in. */
  admin?: boolean
}

/**
 * Gate for routes that need a sign-in. Wrap any project's private pages
 * with it; the session is shared, so signing in for one unlocks them all.
 *
 * This is convenience and clarity, not security — anything that must be
 * protected has to be enforced by row-level security in the database as
 * well, since the whole app is client-side.
 */
export default function RequireAuth({ children, admin = false }: RequireAuthProps) {
  const { session, loading, email, isAdmin, configured } = useAuth()
  const location = useLocation()
  const { t } = useTranslation()

  if (!configured) {
    return (
      <Container maxWidth="sm">
        <Alert severity="error">{t('auth.notConfigured')}</Alert>
      </Container>
    )
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!session) {
    return (
      <Navigate
        to={SIGN_IN_PATH}
        replace
        state={{ returnTo: location.pathname + location.search }}
      />
    )
  }

  if (admin && !isAdmin) {
    return (
      <Container maxWidth="sm">
        <Paper variant="outlined" sx={{ p: 4 }}>
          <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
            <Typography variant="h6" component="h1">
              {t('auth.notAdminTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('auth.notAdminBody', { email })}
            </Typography>
            <Button variant="contained" component={RouterLink} to="/">
              {t('auth.backHome')}
            </Button>
          </Stack>
        </Paper>
      </Container>
    )
  }

  return <>{children}</>
}
