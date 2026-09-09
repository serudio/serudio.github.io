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
  const count = converters.length

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Конвертери
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
                {count} онлайн-{count === 1 ? 'конвертер' : 'конвертери'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {converters[0]?.name}
                {count > 1 ? ' та інші' : ''}
              </Typography>
            </Box>
          </Stack>
          <Button
            component={RouterLink}
            to="/converters"
            endIcon={<ArrowForwardIcon fontSize="small" />}
            size="small"
          >
            Переглянути всі
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}
