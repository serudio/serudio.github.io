import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'

export default function Header() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
      <Avatar
        src="/logo.svg"
        alt="serudio"
        variant="rounded"
        sx={{ width: 48, height: 48, bgcolor: 'transparent' }}
      />
      <Box>
        <Typography variant="h5" component="h1" sx={{ lineHeight: 1.2 }}>
          Вітаємо на serudio.github.io
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Особисті проєкти та невеликі інструменти
        </Typography>
      </Box>
    </Box>
  )
}
