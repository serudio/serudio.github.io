import { useTranslation } from 'react-i18next'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { Link as RouterLink } from 'react-router-dom'
import Seo from '../components/Seo'
import { converters } from '../data/converters'

export default function ConvertersIndexPage() {
  const { t } = useTranslation()

  return (
    <Container maxWidth="sm" disableGutters>
      <Seo title={t('converters.heading')} description={t('converters.seoDescription')} path="/converters" />
      <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 5 }}>
        <Typography variant="h5" component="h1" sx={{ mb: 1 }}>
          {t('converters.heading')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('converters.indexDescription')}
        </Typography>
        <Stack spacing={1.5}>
          {converters.map((converter) => (
            <Card key={converter.slug} variant="outlined">
              <CardActionArea component={RouterLink} to={`/converters/${converter.slug}`}>
                <CardContent
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <Stack>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {t(converter.nameKey)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t(converter.descriptionKey)}
                    </Typography>
                  </Stack>
                  <ArrowForwardIcon fontSize="small" color="action" />
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      </Paper>
    </Container>
  )
}
