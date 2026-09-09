import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'

const REDIRECT_URL = 'https://serudio.github.io/todo-cloud'
const TOTAL_SECONDS = 60

export default function RedirectHero() {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS)
  const [cancelled, setCancelled] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (cancelled) return

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          window.location.href = REDIRECT_URL
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [cancelled])

  const handleCancel = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setCancelled(true)
  }

  const progress = (secondsLeft / TOTAL_SECONDS) * 100

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 4,
        textAlign: 'center',
      }}
    >
      {!cancelled ? (
        <>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Автоматичне перенаправлення до головного проєкту
          </Typography>

          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
            <CircularProgress
              variant="determinate"
              value={progress}
              size={100}
              thickness={3}
              sx={{
                color: 'primary.main',
                '& .MuiCircularProgress-circle': { strokeLinecap: 'round' },
              }}
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h5" fontWeight={700}>
                {secondsLeft}
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              href={REDIRECT_URL}
            >
              Перейти зараз
            </Button>
            <Button variant="outlined" color="inherit" onClick={handleCancel}>
              Скасувати
            </Button>
          </Stack>
        </>
      ) : (
        <Typography variant="body1" color="text.secondary">
          Перенаправлення скасовано. Оберіть проєкт зі списку нижче:
        </Typography>
      )}
    </Paper>
  )
}
