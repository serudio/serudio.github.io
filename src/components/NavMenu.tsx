import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Popover from '@mui/material/Popover'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import MenuIcon from '@mui/icons-material/Menu'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import { GROUP_HEADING_KEYS, HOME_LINK_GROUPS, homeLinks } from '../data/homeLinks'
import { localUsageStore } from '../lib/usage'

/**
 * Everywhere you can go, from any page.
 *
 * Built from the same registry as the home page (src/data/homeLinks.ts),
 * so a new destination appears in both from one entry rather than being
 * added to a hand-maintained nav as well. Opening one here counts
 * towards "most used" too — it is the same link either way.
 */
export default function NavMenu() {
  const { t } = useTranslation()
  const location = useLocation()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  const close = () => setAnchor(null)

  const open = (id: string) => {
    localUsageStore.record(id)
    close()
  }

  return (
    <>
      <Tooltip title={t('nav.menu')}>
        <IconButton
          size="small"
          onClick={(event) => setAnchor(event.currentTarget)}
          aria-label={t('nav.menu')}
        >
          <MenuIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { sx: { minWidth: 220, maxHeight: '70vh' } } }}
      >
        <MenuItem
          component={RouterLink}
          to="/"
          onClick={close}
          selected={location.pathname === '/'}
        >
          <HomeOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />
          {t('nav.home')}
        </MenuItem>

        {HOME_LINK_GROUPS.map((group) => {
          const links = homeLinks.filter((link) => link.group === group)
          if (links.length === 0) return null

          return (
            <Box key={group}>
              <Divider />
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  px: 2,
                  pt: 1,
                  pb: 0.5,
                  textTransform: 'lowercase',
                  letterSpacing: '0.02em',
                  color: 'text.secondary',
                  fontWeight: 600,
                }}
              >
                {t(GROUP_HEADING_KEYS[group])}
              </Typography>

              {links.map((link) =>
                link.to ? (
                  <MenuItem
                    key={link.id}
                    component={RouterLink}
                    to={link.to}
                    selected={location.pathname === link.to}
                    onClick={() => open(link.id)}
                  >
                    {t(link.labelKey)}
                  </MenuItem>
                ) : (
                  <MenuItem
                    key={link.id}
                    component="a"
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => open(link.id)}
                  >
                    {t(link.labelKey)}
                  </MenuItem>
                ),
              )}
            </Box>
          )
        })}
      </Popover>
    </>
  )
}
