import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeModeSwitcher from './ThemeModeSwitcher'

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{
          textTransform: 'lowercase',
          letterSpacing: '0.02em',
          color: 'text.secondary',
          fontWeight: 600,
          display: 'block',
          mb: 0.75,
        }}
      >
        {label}
      </Typography>
      {children}
    </Box>
  )
}

/**
 * Theme and language behind one gear.
 *
 * Both were sitting in the header as five visible buttons, which is a
 * lot of chrome for settings most visitors touch once and never again.
 * The switchers themselves are unchanged — they are just rendered in
 * here now, so each still owns its own behaviour and storage.
 */
export default function SettingsMenu() {
  const { t } = useTranslation()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  return (
    <>
      <Tooltip title={t('settings.title')}>
        <IconButton
          size="small"
          onClick={(event) => setAnchor(event.currentTarget)}
          aria-label={t('settings.title')}
        >
          <SettingsOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Popover
        open={anchor !== null}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Stack spacing={2} sx={{ p: 2 }}>
          <Section label={t('theme.label')}>
            <ThemeModeSwitcher />
          </Section>
          <Section label={t('language.label')}>
            <LanguageSwitcher />
          </Section>
        </Stack>
      </Popover>
    </>
  )
}
