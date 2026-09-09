import { useTranslation } from 'react-i18next'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '../i18n'

/**
 * Explicit language override. Picking one here is remembered
 * (localStorage, via i18next-browser-languagedetector) and wins over the
 * automatic browser-language default from then on. See src/i18n/index.ts.
 */
export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const current = SUPPORTED_LANGUAGES.includes(i18n.language as SupportedLanguage)
    ? (i18n.language as SupportedLanguage)
    : 'en'

  return (
    <ToggleButtonGroup
      value={current}
      exclusive
      size="small"
      aria-label={t('language.label')}
      onChange={(_, next: SupportedLanguage | null) => {
        if (next) void i18n.changeLanguage(next)
      }}
    >
      {SUPPORTED_LANGUAGES.map((lng) => (
        <ToggleButton key={lng} value={lng} sx={{ px: 1.25, py: 0.25, fontSize: 12, lineHeight: 1.5 }}>
          {t(`language.${lng}`)}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
