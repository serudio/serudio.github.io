import { useTranslation } from 'react-i18next'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Seo from '../components/Seo'

export default function PrivacyPage() {
  const { t } = useTranslation()

  return (
    <Container maxWidth="sm" disableGutters>
      <Seo title={t('privacy.title')} description={t('privacy.seoDescription')} path="/privacy" />
      <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 5 }}>
        <Stack spacing={2}>
          <Typography variant="h5" component="h1" sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
            {t('privacy.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('privacy.intro')}
          </Typography>
          <Typography variant="h6" component="h2">
            {t('privacy.cookiesHeading')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('privacy.cookiesBody1')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('privacy.cookiesBody2')}
          </Typography>
          <Link href="/" variant="body2">
            &larr; {t('privacy.backHome')}
          </Link>
        </Stack>
      </Paper>
    </Container>
  )
}
