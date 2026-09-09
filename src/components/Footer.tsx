import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

export default function Footer() {
  return (
    <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
      >
        <Typography variant="caption" color="text.secondary">
          &copy; {new Date().getFullYear()} serudio
        </Typography>
        <Link href="/privacy" variant="caption" color="text.secondary" underline="hover">
          Політика конфіденційності
        </Link>
      </Stack>
    </Box>
  )
}
