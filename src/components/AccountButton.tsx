import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuth } from '../auth/useAuth'

/**
 * Who is signed in, in as little header space as an avatar.
 *
 * Renders nothing at all when signed out: the header already carries
 * four controls, and a sign-in button there would compete with them for
 * a page most visitors read without an account. Signing in happens from
 * the page that needs it, via <RequireAuth>.
 */
export default function AccountButton() {
  const { t } = useTranslation()
  const { session, email, signOut } = useAuth()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  if (!session) return null

  // Google supplies one of these; the initial is the fallback when it
  // supplies neither, so the button is never empty.
  const metadata = session.user.user_metadata as { avatar_url?: string; picture?: string }
  const photo = metadata.avatar_url ?? metadata.picture
  const initial = (email ?? '?').trim().charAt(0).toUpperCase()

  return (
    <>
      <Tooltip title={email ?? t('auth.account')}>
        <IconButton
          size="small"
          onClick={(event) => setAnchor(event.currentTarget)}
          aria-label={email ?? t('auth.account')}
          sx={{ p: 0.25 }}
        >
          <Avatar
            src={photo}
            alt=""
            sx={{ width: 26, height: 26, fontSize: 13, bgcolor: 'primary.main' }}
          >
            {initial}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ px: 2, py: 1, maxWidth: 260, wordBreak: 'break-all' }}
        >
          {email}
        </Typography>
        <Divider />
        <MenuItem
          onClick={() => {
            setAnchor(null)
            void signOut()
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          {t('auth.signOut')}
        </MenuItem>
      </Menu>
    </>
  )
}
