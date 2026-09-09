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
  return (
    <Container maxWidth="sm" disableGutters>
      <Seo
        title="Конвертери"
        description="Безкоштовні онлайн-конвертери одиниць виміру: витрата пального та інші."
        path="/converters"
      />
      <Paper elevation={0} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 5 }}>
        <Typography variant="h5" component="h1" sx={{ mb: 1 }}>
          Конвертери
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Невеликі онлайн-інструменти для конвертації одиниць виміру.
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
                      {converter.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {converter.description}
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
