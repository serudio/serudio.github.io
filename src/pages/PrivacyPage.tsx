import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'

export default function PrivacyPage() {
  return (
    <Container maxWidth="sm" disableGutters>
      <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 5 }}>
        <Stack spacing={2}>
          <Typography variant="h5" component="h1" sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
            Політика конфіденційності
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Цей сайт використовує служби Google AdSense для відображення рекламних оголошень.
          </Typography>
          <Typography variant="h6" component="h2">
            Файли cookie та реклама Google
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Google як сторонній постачальник використовує файли cookie для показу оголошень на
            цьому сайті. Використання файлів cookie допомагає Google та його партнерам показувати
            рекламу на основі відвідувань користувачами цього або інших сайтів в Інтернеті.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Користувачі можуть вимкнути персоналізовану рекламу, перейшовши в налаштування
            рекламних уподобань свого Google-акаунта.
          </Typography>
          <Link href="/" variant="body2">
            &larr; Повернутися на головну
          </Link>
        </Stack>
      </Paper>
    </Container>
  )
}
