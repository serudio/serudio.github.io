import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Link as RouterLink } from 'react-router-dom'
import { converters } from '../data/converters'

export default function ConvertersTeaser() {
  const { t } = useTranslation()
  const count = converters.length
  const firstName = converters[0] ? t(converters[0].nameKey) : ''

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t('converters.heading')}
      </Typography>
      <Card variant="outlined">
        <CardContent
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            '&:last-child': { pb: 2 },
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <SwapHorizIcon color="secondary" />
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {t('converters.countOnlineConverter', { count })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {firstName}
                {count > 1 ? ` ${t('converters.andOthers')}` : ''}
              </Typography>
            </Box>
          </Stack>
          <Button
            component={RouterLink}
            to="/converters"
            endIcon={<ArrowForwardIcon fontSize="small" />}
            size="small"
          >
            {t('converters.viewAll')}
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}
