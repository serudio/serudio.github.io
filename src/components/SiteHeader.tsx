import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Link from '@mui/material/Link'
import { NavLink, Link as RouterLink } from 'react-router-dom'
import NavMenu from './NavMenu'
import SettingsMenu from './SettingsMenu'
import AccountButton from './AccountButton'
import { usePageChrome } from './pageChrome'

/**
 * One row for the whole top of the page: the mark, where the current
 * page goes back to, and the three menus.
 *
 * The back link used to be drawn by each page, in a row beneath this
 * one, which spent two rows on furniture before any content. It is
 * handed up instead — see pageChrome.ts — and the container follows the
 * page's own width so the header lines up with what is under it.
 */
export default function SiteHeader() {
  const { back, width } = usePageChrome()

  return (
    <Container maxWidth={width} disableGutters>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          {/* Logo and wordmark are one link: clicking the mark is the
              long-standing way back to the home page, and it was not. */}
          <Link
            component={NavLink}
            to="/"
            underline="none"
            color="text.primary"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Avatar
              src="/logo.svg"
              /* Empty: the wordmark beside it already says "serudio", and
                 reading it twice helps nobody. */
              alt=""
              variant="rounded"
              sx={{ width: 28, height: 28, bgcolor: 'transparent' }}
            />
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1}>
              serudio
            </Typography>
          </Link>

          {back && (
            <>
              <Typography component="span" color="text.disabled" aria-hidden>
                /
              </Typography>
              <Link
                component={RouterLink}
                to={back.to}
                variant="body2"
                color="text.secondary"
                underline="hover"
                sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                &larr; {back.label}
              </Link>
            </>
          )}
        </Stack>

        {/* Three icons instead of the seven controls that used to live
            here, so the row no longer needs to wrap on a phone. */}
        <Stack direction="row" spacing={0.5} alignItems="center">
          <NavMenu />
          <SettingsMenu />
          {/* Renders nothing when signed out, so the header does not grow
              for visitors who never sign in. */}
          <AccountButton />
        </Stack>
      </Box>
    </Container>
  )
}
