import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Link from '@mui/material/Link'
import { NavLink } from 'react-router-dom'
import NavMenu from './NavMenu'
import SettingsMenu from './SettingsMenu'
import AccountButton from './AccountButton'

export default function SiteHeader() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
      }}
    >
      {/* Logo and wordmark are one link: clicking the mark is the
          long-standing way back to the home page, and it was not. */}
      <Link
        component={NavLink}
        to="/"
        underline="none"
        color="text.primary"
        sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}
      >
        <Avatar
          src="/logo.svg"
          /* Empty: the wordmark beside it already says "serudio", and
             reading it twice helps nobody. */
          alt=""
          variant="rounded"
          sx={{ width: 40, height: 40, bgcolor: 'transparent' }}
        />
        <Typography variant="h6" fontWeight={700}>
          serudio
        </Typography>
      </Link>
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
  )
}
