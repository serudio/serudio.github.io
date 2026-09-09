import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Snackbar from '@mui/material/Snackbar'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { convertLayout, detectDirection, type LayoutDirection } from '../../lib/keyboardLayout'

type DirectionMode = 'auto' | LayoutDirection

export default function KeyboardLayoutCalculator() {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<DirectionMode>('auto')
  const [copied, setCopied] = useState(false)

  const detected = useMemo(() => detectDirection(input), [input])
  const effectiveDirection: LayoutDirection = mode === 'auto' ? (detected ?? 'en-to-ua') : mode
  const output = useMemo(
    () => (input ? convertLayout(input, effectiveDirection) : ''),
    [input, effectiveDirection],
  )

  const handleCopy = async () => {
    if (!output) return
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
    } catch {
      // Clipboard API unavailable/blocked — nothing useful to do, fail silently.
    }
  }

  return (
    <>
      <TextField
        multiline
        minRows={3}
        fullWidth
        autoFocus
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t('keyboardLayoutCalculator.inputPlaceholder')}
        sx={{ mb: 2 }}
      />

      <ToggleButtonGroup
        value={mode}
        exclusive
        size="small"
        onChange={(_, next: DirectionMode | null) => next && setMode(next)}
        sx={{ mb: 2, flexWrap: 'wrap' }}
      >
        <ToggleButton value="auto">{t('keyboardLayoutCalculator.modeAuto')}</ToggleButton>
        <ToggleButton value="en-to-ua">{t('keyboardLayoutCalculator.modeEnToUa')}</ToggleButton>
        <ToggleButton value="ua-to-en">{t('keyboardLayoutCalculator.modeUaToEn')}</ToggleButton>
      </ToggleButtonGroup>

      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default',
          minHeight: 88,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography
            variant="caption"
            sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary', fontWeight: 700 }}
          >
            {t('keyboardLayoutCalculator.outputLabel')}
          </Typography>
          <Tooltip title={t('keyboardLayoutCalculator.copy')}>
            <span>
              <IconButton size="small" onClick={handleCopy} disabled={!output} aria-label={t('keyboardLayoutCalculator.copy')}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
        <Typography
          variant="body1"
          sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: output ? 'info.main' : 'text.secondary' }}
        >
          {output || t('keyboardLayoutCalculator.emptyHint')}
        </Typography>
      </Box>

      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message={t('keyboardLayoutCalculator.copied')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </>
  )
}
