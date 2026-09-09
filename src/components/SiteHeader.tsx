import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Link from '@mui/material/Link'
import { NavLink } from 'react-router-dom'
import LanguageSwitcher from './LanguageSwitcher'

const navLinkSx = {
  '&.active': { color: 'primary.main' },
}

export default function SiteHeader() {
  const { t } = useTranslation()

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
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Avatar
          src="/logo.svg"
          alt="serudio"
          variant="rounded"
          sx={{ width: 40, height: 40, bgcolor: 'transparent' }}
        />
        <Link component={NavLink} to="/" underline="none" color="text.primary">
          <Typography variant="h6" fontWeight={700}>
            serudio
          </Typography>
        </Link>
      </Stack>
      <Stack direction="row" spacing={2.5} alignItems="center">
        <Link component={NavLink} to="/" underline="hover" color="text.secondary" sx={navLinkSx} end>
          {t('nav.home')}
        </Link>
        <Link component={NavLink} to="/converters" underline="hover" color="text.secondary" sx={navLinkSx}>
          {t('nav.converters')}
        </Link>
        <LanguageSwitcher />
      </Stack>
    </Box>
  )
}
